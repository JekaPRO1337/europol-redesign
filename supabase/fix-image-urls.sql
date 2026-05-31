-- Исправление URL картинок - убираем лишние префиксы
UPDATE products 
SET image = 'products/' || 
  SUBSTRING(image FROM POSITION('products/' IN image) + LENGTH('products/'))
WHERE image LIKE 'https://europolua.com%' OR image LIKE 'products/https://%';
