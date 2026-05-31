-- Исправление URL картинок - извлекаем только имя файла
UPDATE products 
SET image = 'products/' || regexp_replace(image, '^.*/', '')
WHERE image LIKE 'https://europolua.com%' OR image LIKE 'products/https://%';
