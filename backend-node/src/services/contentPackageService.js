/**
 * Content Package Service
 * Handles packaging of academy exports into compressed, validated packages
 * for distribution and import into other instances
 */

const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

class ContentPackageService {
  constructor() {
    this.packagesDir = path.join(__dirname, '../../packages');
    this.initialize();
  }

  /**
   * Initialize packages directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.packagesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating packages directory:', error);
    }
  }

  /**
   * Create a content package from export data
   * @param {Object} exportData - The academy export data
   * @param {Object} options - Package options
   * @returns {Promise<Object>} Package metadata
   */
  async createPackage(exportData, options = {}) {
    const {
      format = 'zip',
      includeAssets = false,
      compression = 'default',
    } = options;

    // Validate export data
    const validation = this.validateExportData(exportData);
    if (!validation.valid) {
      throw new Error(`Invalid export data: ${validation.errors.join(', ')}`);
    }

    // Generate package metadata
    const packageId = this.generatePackageId(exportData.academy);
    const packageMeta = this.generatePackageMetadata(exportData, packageId);

    // Create package directory
    const packageDir = path.join(this.packagesDir, packageId);
    await fs.mkdir(packageDir, { recursive: true });

    // Write export data
    const dataPath = path.join(packageDir, 'academy-data.json');
    await fs.writeFile(dataPath, JSON.stringify(exportData, null, 2), 'utf8');

    // Write package metadata
    const metaPath = path.join(packageDir, 'package-meta.json');
    await fs.writeFile(metaPath, JSON.stringify(packageMeta, null, 2), 'utf8');

    // Create manifest
    const manifest = await this.createManifest(packageDir, exportData);
    const manifestPath = path.join(packageDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    // Compress package
    const archivePath = await this.compressPackage(
      packageDir,
      packageId,
      format,
      compression
    );

    // Generate final checksum
    const fileChecksum = await this.calculateFileChecksum(archivePath);

    // Update metadata with archive info
    packageMeta.archive = {
      path: archivePath,
      format,
      size: (await fs.stat(archivePath)).size,
      checksum: fileChecksum,
      createdAt: new Date().toISOString(),
    };

    // Update metadata file
    await fs.writeFile(metaPath, JSON.stringify(packageMeta, null, 2), 'utf8');

    return packageMeta;
  }

  /**
   * Validate export data structure
   * @param {Object} exportData - Export data to validate
   * @returns {Object} Validation result
   */
  validateExportData(exportData) {
    const errors = [];

    // Check required fields
    if (!exportData.academy) {
      errors.push('Missing academy data');
    } else {
      if (!exportData.academy.id) errors.push('Missing academy.id');
      if (!exportData.academy.name) errors.push('Missing academy.name');
      if (!exportData.academy.slug) errors.push('Missing academy.slug');
    }

    if (!exportData.exportMetadata) {
      errors.push('Missing exportMetadata');
    } else {
      if (!exportData.exportMetadata.checksum) {
        errors.push('Missing data checksum');
      }
      if (!exportData.exportMetadata.formatVersion) {
        errors.push('Missing format version');
      }
    }

    // Validate format version
    if (
      exportData.exportMetadata &&
      exportData.exportMetadata.formatVersion !== '2.0.0'
    ) {
      errors.push(`Unsupported format version: ${exportData.exportMetadata.formatVersion}`);
    }

    // Verify checksum
    if (exportData.exportMetadata && exportData.exportMetadata.checksum) {
      const calculatedChecksum = this.calculateDataChecksum(exportData);
      if (calculatedChecksum !== exportData.exportMetadata.checksum) {
        errors.push('Checksum mismatch - data may be corrupted');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate checksum for export data
   * @param {Object} exportData - Export data
   * @returns {string} SHA-256 checksum
   */
  calculateDataChecksum(exportData) {
    const dataString = JSON.stringify({
      academy: exportData.academy,
      settings: exportData.settings,
      courses: exportData.courses,
    });
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Calculate checksum for a file
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} SHA-256 checksum
   */
  async calculateFileChecksum(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Generate unique package ID
   * @param {Object} academy - Academy data
   * @returns {string} Package ID
   */
  generatePackageId(academy) {
    const timestamp = Date.now();
    const slug = academy.slug.replace(/[^a-z0-9-]/gi, '-');
    return `${slug}-${timestamp}`;
  }

  /**
   * Generate package metadata
   * @param {Object} exportData - Export data
   * @param {string} packageId - Package ID
   * @returns {Object} Package metadata
   */
  generatePackageMetadata(exportData, packageId) {
    return {
      packageId,
      packageVersion: '1.0.0',
      formatVersion: exportData.exportMetadata.formatVersion,
      academy: {
        id: exportData.academy.id,
        name: exportData.academy.name,
        slug: exportData.academy.slug,
        version: exportData.academy.version,
      },
      content: exportData.exportMetadata.contentCounts || {
        courses: exportData.courses?.length || 0,
        modules: 0,
        lessons: 0,
        quizzes: 0,
      },
      exportedAt: exportData.exportMetadata.exportedAt,
      exportedBy: exportData.exportMetadata.exportedBy,
      dataChecksum: exportData.exportMetadata.checksum,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create manifest file
   * @param {string} packageDir - Package directory
   * @param {Object} exportData - Export data
   * @returns {Promise<Object>} Manifest
   */
  async createManifest(packageDir, exportData) {
    const files = await fs.readdir(packageDir);
    const manifest = {
      version: '1.0.0',
      files: [],
      totalSize: 0,
    };

    for (const file of files) {
      const filePath = path.join(packageDir, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        const checksum = await this.calculateFileChecksum(filePath);
        manifest.files.push({
          name: file,
          size: stats.size,
          checksum,
          type: path.extname(file).slice(1) || 'json',
        });
        manifest.totalSize += stats.size;
      }
    }

    return manifest;
  }

  /**
   * Compress package directory
   * @param {string} packageDir - Package directory
   * @param {string} packageId - Package ID
   * @param {string} format - Archive format (zip, tar.gz)
   * @param {string} compression - Compression level
   * @returns {Promise<string>} Path to archive
   */
  async compressPackage(packageDir, packageId, format = 'zip', compression = 'default') {
    const archivePath = path.join(
      this.packagesDir,
      `${packageId}.${format === 'tar.gz' ? 'tar.gz' : 'zip'}`
    );

    const output = require('fs').createWriteStream(archivePath);
    const archive = archiver(format === 'tar.gz' ? 'tar' : 'zip', {
      gzip: format === 'tar.gz',
      zlib: {
        level: compression === 'high' ? 9 : compression === 'low' ? 3 : 6,
      },
    });

    // Handle errors
    archive.on('error', (err) => {
      throw err;
    });

    // Pipe archive to output file
    archive.pipe(output);

    // Add directory contents to archive
    archive.directory(packageDir, false);

    // Finalize archive
    await archive.finalize();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });

    return archivePath;
  }

  /**
   * Extract package
   * @param {string} packagePath - Path to package archive
   * @param {string} extractDir - Directory to extract to
   * @returns {Promise<Object>} Package metadata
   */
  async extractPackage(packagePath, extractDir) {
    const AdmZip = require('adm-zip');

    // Create extraction directory
    await fs.mkdir(extractDir, { recursive: true });

    // Extract archive
    if (packagePath.endsWith('.zip')) {
      const zip = new AdmZip(packagePath);
      zip.extractAllTo(extractDir, true);
    } else {
      throw new Error('Unsupported archive format');
    }

    // Read package metadata
    const metaPath = path.join(extractDir, 'package-meta.json');
    const metaData = await fs.readFile(metaPath, 'utf8');
    return JSON.parse(metaData);
  }

  /**
   * Verify package integrity
   * @param {string} packageDir - Package directory
   * @returns {Promise<Object>} Verification result
   */
  async verifyPackage(packageDir) {
    const errors = [];

    // Check required files
    const requiredFiles = ['academy-data.json', 'package-meta.json', 'manifest.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(packageDir, file);
      try {
        await fs.access(filePath);
      } catch {
        errors.push(`Missing required file: ${file}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Verify manifest checksums
    const manifestPath = path.join(packageDir, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

    for (const fileInfo of manifest.files) {
      if (fileInfo.name === 'manifest.json') continue;

      const filePath = path.join(packageDir, fileInfo.name);
      const checksum = await this.calculateFileChecksum(filePath);

      if (checksum !== fileInfo.checksum) {
        errors.push(`Checksum mismatch for ${fileInfo.name}`);
      }
    }

    // Verify export data checksum
    const dataPath = path.join(packageDir, 'academy-data.json');
    const exportData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    const validation = this.validateExportData(exportData);

    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * List all packages
   * @returns {Promise<Array>} List of package metadata
   */
  async listPackages() {
    const files = await fs.readdir(this.packagesDir);
    const packages = [];

    for (const file of files) {
      if (file.endsWith('.zip') || file.endsWith('.tar.gz')) {
        const filePath = path.join(this.packagesDir, file);
        const stats = await fs.stat(filePath);
        packages.push({
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        });
      }
    }

    return packages;
  }

  /**
   * Delete package
   * @param {string} packageId - Package ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePackage(packageId) {
    // Delete archive files
    const formats = ['zip', 'tar.gz'];
    for (const format of formats) {
      const archivePath = path.join(this.packagesDir, `${packageId}.${format}`);
      try {
        await fs.unlink(archivePath);
      } catch {
        // File might not exist
      }
    }

    // Delete package directory
    const packageDir = path.join(this.packagesDir, packageId);
    try {
      await fs.rm(packageDir, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = ContentPackageService;
