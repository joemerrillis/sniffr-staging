import {
  createWalkReportController,
} from '../controller/createWalkReport.js';
import {
  updateWalkReportController,
} from '../controller/updateWalkReport.js';
import {
  getWalkReportController,
} from '../controller/getWalkReport.js';
import {
  listWalkReportsController,
} from '../controller/listWalkReports.js';
import {
  deleteWalkReportController,
} from '../controller/deleteWalkReport.js';
import {
  getWalkReportWithDetailsController,
} from '../controller/getWalkReportWithDetails.js';

export default function (fastify, opts, next) {
  fastify.post('/walk-reports', {
    schema: { body: 'CreateWalkReport#', response: { 201: 'WalkReport#' } },
    tags: ['WalkReports'],
  }, createWalkReportController);

  fastify.get('/walk-reports/:id', {
    schema: { response: { 200: 'WalkReport#' } },
    tags: ['WalkReports'],
  }, getWalkReportController);

  fastify.get('/walk-reports', {
    schema: { response: { 200: { type: 'array', items: 'WalkReport#' } } },
    tags: ['WalkReports'],
  }, listWalkReportsController);

  fastify.patch('/walk-reports/:id', {
    schema: { body: 'UpdateWalkReport#', response: { 200: 'WalkReport#' } },
    tags: ['WalkReports'],
  }, updateWalkReportController);

  fastify.delete('/walk-reports/:id', {
    tags: ['WalkReports'],
  }, deleteWalkReportController);

  fastify.get('/walk-reports/:id/details', {
    schema: { response: { 200: 'WalkReportDetailed#' } },
    tags: ['WalkReports'],
  }, getWalkReportWithDetailsController);

  next();
}
