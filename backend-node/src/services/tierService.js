const { Tier } = require('../models');

const getAllTiers = async () => {
  const tiers = await Tier.findAll({
    order: [['level', 'ASC']],
  });
  return tiers;
};

module.exports = {
  getAllTiers,
};
