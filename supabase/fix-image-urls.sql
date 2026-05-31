-- Обновление URL картинок на полные пути с europolua.com
UPDATE products 
SET image = 'https://europolua.com/wp-content/uploads/2024/09/' || image
WHERE image NOT LIKE 'https://%';
