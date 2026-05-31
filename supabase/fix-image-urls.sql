-- Обновление URL картинок на относительные пути для GitHub Pages
UPDATE products 
SET image = 'products/' || image
WHERE image NOT LIKE 'products/%';
