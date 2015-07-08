module.exports = {
    mongoDb: {
        uri: {
            doc: 'The MongoDB connection string',
            format: String,
            default: null,  // required, must be set via env var
            env: 'MONGO_URL'
        }
    }
};
