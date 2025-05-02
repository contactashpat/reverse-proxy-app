// Test environment variables for settings validation
process.env.SSL_KEY_PATH = 'dummy-key';
process.env.SSL_CERT_PATH = 'dummy-cert';
process.env.HTTP_REDIRECT_PORT = '8080';
process.env.HTTPS_PORT = '8443';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';
process.env.SMTP_HOST = 'smtp.test';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.EMAIL_FROM = 'from@test.com';
process.env.EMAIL_TO = 'to@test.com';
process.env.SENDGRID_API_KEY = 'SG.testkey';
