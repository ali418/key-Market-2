-- إنشاء قاعدة البيانات
CREATE DATABASE grocery_management;

-- استخدام قاعدة البيانات
\c grocery_management;

-- إنشاء جدول الفئات
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  description_ar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المنتجات
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  barcode VARCHAR(50),
  sku VARCHAR(50),
  image_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المخزون
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المستخدمين
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدخال بيانات تجريبية للفئات
INSERT INTO categories (name, name_ar, description, description_ar) VALUES
('Fruits', 'فواكه', 'Fresh fruits', 'فواكه طازجة'),
('Vegetables', 'خضروات', 'Fresh vegetables', 'خضروات طازجة'),
('Dairy', 'منتجات الألبان', 'Dairy products', 'منتجات الألبان'),
('Bakery', 'مخبوزات', 'Bakery products', 'منتجات المخبز'),
('Meat', 'لحوم', 'Meat products', 'منتجات اللحوم');

-- إدخال بيانات تجريبية للمنتجات
INSERT INTO products (name, name_ar, description, description_ar, price, cost, category_id) VALUES
('Apples', 'تفاح', 'Fresh red apples', 'تفاح أحمر طازج', 2.99, 1.99, 1),
('Bananas', 'موز', 'Yellow bananas', 'موز أصفر', 1.99, 0.99, 1),
('Tomatoes', 'طماطم', 'Fresh tomatoes', 'طماطم طازجة', 3.49, 2.49, 2),
('Milk', 'حليب', 'Fresh milk', 'حليب طازج', 2.49, 1.49, 3),
('Bread', 'خبز', 'Fresh bread', 'خبز طازج', 1.99, 0.99, 4),
('Chicken', 'دجاج', 'Fresh chicken', 'دجاج طازج', 7.99, 5.99, 5);

-- إدخال بيانات تجريبية للمخزون
INSERT INTO inventory (product_id, quantity, min_quantity) VALUES
(1, 100, 20),
(2, 150, 30),
(3, 80, 15),
(4, 50, 10),
(5, 60, 15),
(6, 40, 10);

-- إنشاء مستخدم مسؤول
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$eCjz/mS/5XG5dJGCXSN55.XG5hV5ZvQcTa1wNl1vQZKRtW5CgFgbC', 'admin');
-- كلمة المرور هي 'admin123' (مشفرة باستخدام bcrypt)