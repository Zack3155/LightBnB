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
      *
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
  return getAllProperties(null, 2);
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
  const values = [limit];
  const queryString = `
SELECT
  properties.*,
  AVG(property_reviews.rating) AS average_rating
FROM
  properties
  JOIN property_reviews ON property_id = properties.id
GROUP BY
  properties.id
LIMIT
  $1 :: INTEGER;
    `;

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
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
