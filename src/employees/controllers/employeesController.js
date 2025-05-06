const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../services/employeesService');

exports.list = async (request, reply) => {
  const employees = await listEmployees(request.server);
  reply.send(employees);
};

exports.get = async (request, reply) => {
  const { id } = request.params;
  const employee = await getEmployee(request.server, id);
  if (!employee) return reply.code(404).send({ error: 'Employee not found' });
  reply.send(employee);
};

exports.create = async (request, reply) => {
  const payload = request.body;
  const employee = await createEmployee(request.server, payload);
  reply.code(201).send(employee);
};

exports.update = async (request, reply) => {
  const { id } = request.params;
  const payload = request.body;
  const employee = await updateEmployee(request.server, id, payload);
  if (!employee) return reply.code(404).send({ error: 'Employee not found' });
  reply.send(employee);
};

exports.remove = async (request, reply) => {
  const { id } = request.params;
  await deleteEmployee(request.server, id);
  reply.code(204).send();
};
