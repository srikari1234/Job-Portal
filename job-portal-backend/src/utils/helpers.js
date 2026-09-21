function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPagination(query) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(total, page, limit) {
  return { total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

module.exports = { escapeRegex, getPagination, paginationMeta };
