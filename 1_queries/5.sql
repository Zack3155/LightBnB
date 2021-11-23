SELECT
  reservations.*,
  properties.*,
  AVG(property_reviews.rating) AS average_rating
FROM
  reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE
  properties.owner_id = 1
  AND end_date <= now() :: DATE
GROUP BY
  reservations.id,
  properties.id
ORDER BY
  start_date
LIMIT
  10;