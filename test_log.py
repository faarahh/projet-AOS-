import logging
import logstash

logger = logging.getLogger('wams-test')
logger.setLevel(logging.INFO)
logger.addHandler(logstash.UDPLogstashHandler('logstash', 5000, version=1))
logger.info('Test log depuis lists-service', extra={'app': 'wams', 'service': 'lists-service'})
print('Log envoye !')