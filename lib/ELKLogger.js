var elasticsearch = require('elasticsearch'),
  ELK_HOST = 'https://search-kinesis-ingestion-stage-temp-wlmuadurdfgvyhvjjvhlfzr36u.us-east-1.es.amazonaws.com',
  ELK_INDEX = 'npm-tunnel',
  ELK_TYPE = 'logs',
  winston = require('winston'),
  Elasticsearch = require('winston-elasticsearch'),
  client = new elasticsearch.Client({ host: ELK_HOST });

module.exports = function (username, key, meta, argumants, msg) {
  try {
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg);
    }
    if (typeof meta === 'object') {
      meta.platform = process.platform;
      meta.arch = process.arch,
      meta.version = "1.0.7"
    }

    var esTransportOpts = {
      level: 'info',
      indexPrefix: ELK_INDEX,
      indexSuffixPattern: 'DD-MM-YYYY',
      client: client,
      messageType: ELK_TYPE
    };
    var logger = winston.createLogger({
      transports: [
        new Elasticsearch(esTransportOpts)
      ]
    });
    logger.info('Some message', { username, key, meta, argumants, msg });
  } catch (e) {
    
  }
};
