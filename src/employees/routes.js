// src/employees/routes.js

import { list, get, create, update, remove } from './controllers/employeesController.js';
import { Employee, CreateEmployee, UpdateEmployee } from './schemas/employeesSchemas.js';

export default async function routes(fastify, opts) {
  // List all employees
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all employees for the current tenant.',
        tags: ['Employees'],
        response: {
          200: { type: 'array', items: Employee }
        }
      }
    },
    list
  );

  // Get a single employee by ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get an employee by ID.',
        tags: ['Employees'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: { 200: Employee }
      }
    },
    get
  );

  // Create a new employee
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new employee.',
        tags: ['Employees'],
        body: CreateEmployee,
        response: { 201: Employee }
      }
    },
    create
  );

  // Update an existing employee
  fastify.put(
    '/:id',
    {
      schema: {
        description: 'Update an existing employee.',
        tags: ['Employees'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        body: UpdateEmployee,
        response: { 200: Employee }
      }
    },
    update
  );

  // Delete an employee
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete an employee.',
        tags: ['Employees'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: { 204: {} }
      }
    },
    remove
  );
}
