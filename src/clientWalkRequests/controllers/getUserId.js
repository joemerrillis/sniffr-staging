// controllers/clientWalkRequests/getUserId.js
export default function getUserId(request) {
  return request.user?.id ?? request.user?.sub;
}
