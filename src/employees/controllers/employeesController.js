import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../services/employeesService.js';

export async function list(request, reply) {
  const employees = await listEmployees(request.server);
  reply.send(employees);
}

export async function get(request, reply) {
  const { id } = request.params;
  const employee = await getEmployee(request.server, id);
  if (!employee) {
    return reply.code(404).send({ error: 'Employee not found' });
  }
  reply.send(employee);
}

export async function create(request, reply) {
  const payload = request.body;
  const employee = await createEmployee(request.server, payload);
  reply.code(201).send(employee);
}

export async function update(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const employee = await updateEmployee(request.server, id, payload);
  if (!employee) {
    return reply.code(404).send({ error: 'Employee not found' });
  }
  reply.send(employee);
}

export async function remove(request, reply) {
  const { id } = request.params;
  await deleteEmployee(request.server, id);
  reply.code(204).send();
}
