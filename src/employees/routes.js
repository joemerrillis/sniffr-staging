import { list, get, create, update, remove } from './controllers/employeesController.js';
import { Employee, CreateEmployee, UpdateEmployee } from './schemas/employeesSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/employees', { schema: { response: { 200: { type: 'array', items: Employee } } } }, list);
  fastify.get('/employees/:id', {
    schema: {
      params: { id: { type: 'string', format: 'uuid' } },
      response: { 200: Employee }
    }
  }, get);
  fastify.post('/employees', {
    schema: {
      body: CreateEmployee,
      response: { 201: Employee }
    }
  }, create);
  fastify.put('/employees/:id', {
    schema: {
      params: { id: { type: 'string', format: 'uuid' } },
      body: UpdateEmployee,
      response: { 200: Employee }
    }
  }, update);
  fastify.delete('/employees/:id', {
    schema: {
      params: { id: { type: 'string', format: 'uuid' } }
    }
  }, remove);
}
