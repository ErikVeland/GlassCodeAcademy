import { Sequelize } from 'sequelize';

// Use environment variables or default values
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'glasscode_dev',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

export { sequelize };
