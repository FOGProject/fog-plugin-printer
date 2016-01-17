module.exports = {
  autoPK: false,
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    uid: {
      type: 'string',
      primaryKey: true,
    },
    name: {
      type: 'string',
    },
    type: {
      type: 'string',
    },
    vars: {
      type: 'json',
      required: true,
    },
  },
}
