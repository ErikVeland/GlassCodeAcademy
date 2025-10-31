const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumVote = sequelize.define(
  'ForumVote',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'post_id',
      references: {
        model: 'forum_posts',
        key: 'id',
      },
    },
    voteType: {
      type: DataTypes.ENUM('up', 'down'),
      allowNull: false,
      field: 'vote_type',
    },
  },
  {
    tableName: 'forum_votes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'post_id'],
        name: 'forum_votes_user_post_unique',
      },
      {
        fields: ['post_id'],
        name: 'forum_votes_post_id_idx',
      },
      {
        fields: ['user_id'],
        name: 'forum_votes_user_id_idx',
      },
      {
        fields: ['vote_type'],
        name: 'forum_votes_vote_type_idx',
      },
    ],
  }
);

module.exports = ForumVote;