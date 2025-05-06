async function routes(fastify, opts) {
  const { list, get, create, update, remove } = require('./controllers/employeesController');
  const schemas = require('./schemas/employeesSchemas');

  fastify.get('/employees', { schema: { response: { 200: { type: 'array', items: schemas.Employee } } } }, list);
  fastify.get('/employees/:id', {
    schema: {
      params: { id: { type: 'string', format: 'uuid' } },
      response: { 200: schemas.Employee }
    }
  }, get);
  fastify.post('/employees', {
    schema: {
      body: schemas.CreateEmployee,
      response: { 201: schemas.Employee }
    }
  }, create);
  fastify.put('/employees/:id', {
    schema: {
      params: { id: { type: 'string', format: 'uuid' } },
      body: schemas.UpdateEmployee,
      response: { 200: schemas.Employee }
    }
  }, update);
  fastify.delete('/employees/:id', {
    schema: {
      params: { id: { type: 'string', format: 'uuid' } }
    }
  }, remove);
}

module.exports = routes;
