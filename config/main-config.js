module.exports = {
	// Main Express Related variables
	EXPRESS_IP_ADDRESS : process.env.OPENSHIFT_NODEJS_IP   || 'localhost',
	EXPRESS_PORT_ADDRESS : process.env.OPENSHIFT_NODEJS_PORT || '5555',
	// MongoDB environment variables for openshift
	OPENSHIFT_MONGODB_USERNAME : process.env.OPENSHIFT_MONGODB_DB_USERNAME || ' ',
	OPENSHIFT_MONGODB_PASSWORD : process.env.OPENSHIFT_MONGODB_DB_PASSWORD || ' ',
	OPENSHIFT_MONGODB_HOSTNAME : process.env.OPENSHIFT_MONGODB_DB_HOST || ' ',
	OPENSHIFT_MONGODB_PORT : process.env.OPENSHIFT_MONGODB_DB_PORT || ' ',
	OPENSHIFT_MONGODB_URL : "mongodb://" + this.OPENSHIFT_MONGODB_USERNAME + ':' + this.OPENSHIFT_MONGODB_PASSWORD + "@" + this.OPENSHIFT_MONGODB_HOSTNAME + ':' + this.OPENSHIFT_MONGODB_PORT,
	OPENSHIFT_DB_NAME : 'website',
	// MongoDB environment variables locally
	LOCAL_MONGODB_USERNAME : '',
	LOCAL_MONGODB_PASSWORD : '',
	LOCAL_MONGODB_HOSTNAME : 'localhost',
	LOCAL_MONGODB_PORT : '27017',
	LOCAL_DB_NAME : 'nodeblog',
	//Cloudinary config details
	CLOUD_NAME : 'codejitsu', 
	CLOUD_API_KEY : '818719648838795', 
	CLOUD_API_SECRET : 'YTa5Ul_bzlJ4g0jL9ORMUGjxGYs',

}; 