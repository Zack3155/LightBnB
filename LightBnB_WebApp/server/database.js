const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

// Configure PostgreSQL database
const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});
pool.connect();

/// Users

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const values = [id];
  const queryString = `
SELECT
  *
FROM
  users
WHERE
  id = $1 :: INTEGER;
    `;

  return pool.query(queryString, values)
    .then((result) => result.rows[0])
    .catch((err) => console.log(err.message));
}
exports.getUserWithId = getUserWithId;


/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const values = [email];
  const queryString = `
SELECT
  *
FROM
  users
WHERE
  email = $1;
    `;

  return pool.query(queryString, values)
    .then((result) => result.rows[0])
    .catch((err) => console.log(err.message));
}
exports.getUserWithEmail = getUserWithEmail;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const values = [user.name, user.email, user.password, user.email];
  const queryString = `
INSERT INTO
  users (name, email, PASSWORD)
SELECT
  $1,
  $2,
  $3
WHERE
  NOT EXISTS (
    SELECT
      id
    FROM
      users
    WHERE
      email = $4
  ) RETURNING *;
    `;

  return pool.query(queryString, values)
    .then((result) => result.rows[0])
    .catch((err) => console.log(err.message));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const values = [guest_id, limit];
  const queryString = `
SELECT
  reservations.*,
  properties.*,
  AVG(property_reviews.rating) AS average_rating
FROM
  reservations
  JOIN properties ON property_id = properties.id
  JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE
  end_date <= now() :: DATE
  AND reservations.guest_id = $1
GROUP BY
  reservations.id,
  properties.id
ORDER BY
  start_date desc
LIMIT
  $2;
  `;

  return pool.query(queryString, values)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const values = [];
  let queryString = `
SELECT
  properties.*,
  AVG(property_reviews.rating) AS average_rating
FROM
  properties
  JOIN property_reviews ON property_id = properties.id`;

  if (options.city) {
    values.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${values.length} `;
  }

  if (options.owner_id) {
    values.push(options.owner_id);
    if (options.city)
      queryString += `AND properties.owner_id = $${values.length} `;
    else queryString += ` WHERE properties.owner_id = $${values.length} `;
  }

  if (options.minimum_price_per_night) {
    values.push(options.minimum_price_per_night * 100);
    if (options.city || options.owner_id)
      queryString += `AND cost_per_night >= $${values.length} `;
    else
      queryString += ` WHERE cost_per_night >= $${values.length} `;
  }

  if (options.maximum_price_per_night) {
    values.push(options.maximum_price_per_night * 100);
    if (options.city ||
      options.owner_id ||
      options.minimum_price_per_night)
      queryString += `AND cost_per_night <= $${values.length} `;
    else
      queryString += ` WHERE cost_per_night <= $${values.length} `;
  }

  if (options.minimum_rating) {
    values.push(options.minimum_rating);
    if (options.city ||
      options.owner_id ||
      options.minimum_price_per_night ||
      options.maximum_price_per_night)
      queryString += `AND property_reviews.rating >= $${values.length} `;
    else
      queryString += ` WHERE property_reviews.rating >= $${values.length} `;
  }

  values.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${values.length};
  `;

  //console.log(queryString, values);

  return pool.query(queryString, values)
    .then((result) => result.rows)
    .catch((err) => console.log(err.message));
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const values = [property.owner_id, property.title, property.description,
  property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night,
  property.street, property.city, property.province, property.post_code,
  property.country, property.parking_spaces, property.number_of_bathrooms,
  property.number_of_bedrooms, true, property.title];
  const queryString = `
INSERT INTO
  properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street,city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms, active)
SELECT
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14,
  $15
WHERE
  NOT EXISTS (
    SELECT
      id
    FROM
      properties
    WHERE
      title = $16
  ) RETURNING *;
    `;

  return pool.query(queryString, values)
    .then((result) => result.rows[0])
    .catch((err) => console.log(err.message));
}
exports.addProperty = addProperty;
