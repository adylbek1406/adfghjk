-- Создание базы данных
CREATE DATABASE apakai_shop;

-- Подключение к базе данных
\c apakai_shop;

-- Создание таблицы категорий товаров
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы товаров
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT true,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_slug ON products(slug);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление тестовых данных
INSERT INTO categories (name, slug) VALUES
    ('Электроника', 'electronics'),
    ('Одежда', 'clothing'),
    ('Книги', 'books');

-- Добавление тестовых товаров
INSERT INTO products (category_id, name, slug, description, price, is_available, image_url) VALUES
    (1, 'Смартфон XYZ', 'smartphone-xyz', 'Современный смартфон с отличной камерой', 29999.99, true, '/images/smartphone.jpg'),
    (1, 'Ноутбук ABC', 'laptop-abc', 'Мощный ноутбук для работы и игр', 59999.99, true, '/images/laptop.jpg'),
    (2, 'Футболка Classic', 'tshirt-classic', 'Классическая футболка из 100% хлопка', 999.99, true, '/images/tshirt.jpg'),
    (3, 'Книга "Программирование"', 'book-programming', 'Учебник по современному программированию', 1499.99, true, '/images/book.jpg'); 