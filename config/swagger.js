const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Furniture Marketplace API',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:5001',
    },
  ],
  components: {
    schemas: {
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'number' },
          imageUrl: { type: 'string' },
          seller: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      }
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
