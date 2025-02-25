const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Pool } = require('pg'); 
const crypto = require('crypto');
const bodyParser = require('body-parser');
const config = require('./config'); 
const cors = require('cors');
const app = express();
const axios = require('axios');
const { log } = require('console');
const { startupSnapshot } = require('v8');
const portHttp = 80;  // HTTP
const portHttps = 443;  // HTTPS
require('dotenv').config();

const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ключ
const secretKey = 'jFfh23-fh3ri8-JF73ry-shf32r';

client.connect()
  .then(() => console.log('Подключение к базе данных успешно!'))
  .catch(err => console.error('Ошибка подключения к базе данных:', err));

//   const categories = ['Еда', 'Книги', 'Посуда', 'Аксессуары', 'Электроника', 'Одежда', 'Игрушки', 'Спорт', 'Косметика'];
  
//   function generateRandomPassword(length = 10) {
//       return crypto.randomBytes(length).toString('hex').slice(0, length); 
//   }

//   async function addUser(login, fullname, address, phone_number, password, role) {
//       const hashedPassword = hashPassword(password);
//       const roleValue = role === 'Продавец' ? 1 : 0;
  
//       const query = 'INSERT INTO Users (login, fullname, address, phone_number, password, role) VALUES ($1, $2, $3, $4, $5, $6)';
//       await client.query(query, [login, fullname, address, phone_number, hashedPassword, roleValue]);
//       console.log(`Пользователь добавлен: ${login}`);
//   }
  
//   async function fetchProduct() {
//     const url = 'https://fakerapi.it/api/v1/products?_quantity=1';
//     let attempts = 0;
//     const maxAttempts = 5;

//     while (attempts < maxAttempts) {
//         try {
//             const response = await axios.get(url);
//             return response.data.data[0];
//         } catch (error) {
//             if (error.response && error.response.status === 429) {
//                 attempts++;
//                 const retryAfter = error.response.headers['retry-after'] || 1;
//                 console.log(`Слишком много запросов. Ожидание ${retryAfter} секунд...`);
//                 await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
//             } else {
//                 throw error;
//             }
//         }
//     }

//     throw new Error('Не удалось получить товар после нескольких попыток');
// }
//   // Функция для генерации товаров
//   async function generateProducts(count) {
//       try {

//           // Генерируем продавцов
//           const users = [];
//           for (let i = 2; i < 15; i++) {
//               const login = `user${i + 1}`;
//               const fullname = `Пользователь ${i + 1}`;
//               const address = `Адрес ${i + 1}`;
//               const phone_number = `+7 900 000 00 0${i + 1}`;
//               const password = generateRandomPassword(10);
//               const role = 'Продавец';
  
//               await addUser (login, fullname, address, phone_number, password, role);
//               users.push(login); 
//           }
  
//         // Генерируем товары
//         for (let i = 0; i < count; i++) {
//           const product = await fetchProduct();


//           const name = product.name;
//           const price = parseFloat((Math.random() * 1000).toFixed(2));
//           const user_key = users[Math.floor(Math.random() * users.length)];
//           const category = product.category || categories[Math.floor(Math.random() * categories.length)];
//           const photo_id = null;

//           const query = 'INSERT INTO Products (name, price, user_key, category, photo_id) VALUES ($1, $2, $3, $4, $5)';
//           await client.query(query, [name, price, user_key, category, photo_id]);

//           console.log(`Товар добавлен: ${name}, Цена: ${price} ₽, Категория: ${category}, Пользователь: ${user_key}`);
//       }

//       console.log('Генерация товаров завершена!');
//   } catch (error) {
//       console.error('Ошибка:', error);
//   } finally {
//       await client.end(); 
//   }
// }

// generateProducts(100);

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Приветствую, сервер работает в штатном режиме!');
});

// хеширование
function hashPassword(password) {
  return crypto.createHash('md5').update(password + secretKey).digest('hex');
}

// добавление пользователя
app.post('/addUser', async (req, res) => {
  const { login, fullname, address, phone_number, password, role } = req.body;

  // проверка на уникальность логина
  try {
    const checkQuery = 'SELECT * FROM Users WHERE login = $1';
    const checkResult = await client.query(checkQuery, [login]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Такой логин уже существует!' });
    }
  } catch (error) {
    console.error('Ошибка при проверке логина:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

  const hashedPassword = hashPassword(password);

  const roleValue = role === 'Продавец' ? 1 : 0;

  try {
    const query = 'INSERT INTO Users (login, fullname, address, phone_number, password, role) VALUES ($1, $2, $3, $4, $5, $6)';
    await client.query(query, [login, fullname, address, phone_number, hashedPassword, roleValue]);
    res.status(201).json({ message: 'Пользователь успешно добавлен' });
  } catch (error) {
    console.error('Ошибка при добавлении пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вход пользователя
app.post('/login', async (req, res) => {
  const { login, password } = req.body;
  const hashedPassword = hashPassword(password);

  try {
    const query = 'SELECT * FROM Users WHERE login = $1 AND password = $2';
    const result = await client.query(query, [login, hashedPassword]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.status(200).json({
        message: 'Вход выполнен успешно!',
        role: user.role
      });
    } else {
      res.status(401).json({ error: 'Неверный логин или пароль!' });
    }
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение данных пользователя по логину
app.post('/getUser', async (req, res) => {
  const { login } = req.body;
  console.log("logggggiiin: ", login);
  
  if (!login) {
    return res.status(400).json({ error: 'Логин не указан!' });
  }

  try {
    const query = 'SELECT * FROM Users WHERE login = $1';
    const result = await client.query(query, [login]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // Убираем пароль из ответа
      const { password, ...userData } = user;
      res.status(200).json(userData);
    } else {
      res.status(404).json({ error: 'Пользователь не найден!' });
    }
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/updUser', async (req, res) => {
  const { login, fullname, address, phone_number, password } = req.body;

  try {
    const hashedPassword = hashPassword(password);

    const query = `
      UPDATE Users
      SET fullname = $1, address = $2, phone_number = $3, password = $4
      WHERE login = $5
    `;
    const values = [fullname, address, phone_number, hashedPassword, login];

    const result = await client.query(query, values);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Данные успешно обновлены!' });
    } else {
      res.status(404).json({ message: 'Пользователь не найден!' });
    }
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// Получения списка всех товаров
app.post('/getProducts', async (req, res) => {
  try {
    const query = 'SELECT * FROM Products';
    const result = await client.query(query);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: 'Товары не найдены!' });
    }
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получения списка всех товаров одного продавца
app.post('/getProductsUser', async (req, res) => {
  const { login } = req.body;
  try {
    const query = 'SELECT * FROM Products WHERE user_key = $1';
    const result = await client.query(query, [login]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: 'Товары не найдены!' });
    }
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление данных о товаре
app.post('/updProductsUser', async (req, res) => {
  const { login, id, name, category, price } = req.body;

  try {
    const checkQuery = 'SELECT * FROM Products WHERE user_key = $1 AND id = $2';
    const checkValues = [login, id];
    const checkResult = await client.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      const updateQuery = `
        UPDATE Products 
        SET name = $1, category = $2, price = $3 
        WHERE user_key = $4 AND id = $5
      `;
      const updateValues = [name, category, price, login, id];
      await client.query(updateQuery, updateValues);

      res.status(200).json({ message: 'Товар успешно обновлен!' });
    } else {
      res.status(404).json({ message: 'Товар не найден!' });
    }
  } catch (error) {
    console.error('Ошибка при обновлении товара:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// Удаление товара
app.post('/delProductUser', async (req, res) => {
  const { login, id } = req.body;

  try {
    const checkQuery = 'SELECT * FROM Products WHERE user_key = $1 AND id = $2';
    const checkValues = [login, id];
    const checkResult = await client.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      const deleteQuery = 'DELETE FROM Products WHERE user_key = $1 AND id = $2';
      const deleteValues = [login, id];
      await client.query(deleteQuery, deleteValues);

      res.status(200).json({ message: 'Товар успешно удален!' });
    } else {
      res.status(404).json({ message: 'Товар не найден!' });
    }
  } catch (error) {
    console.error('Ошибка при удалении товара:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// Получения списка всех товаров
app.post('/getAddress', async (req, res) => {
  const { login } = req.body;
  console.log("address:", login);
  try {
    const query = 'SELECT address FROM Users WHERE login = $1';
    const result = await client.query(query, [login]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: 'Адрес не найден!' });
    }
  } catch (error) {
    console.error('Ошибка при получении адреса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавление товара в отложенное
app.post('/setDeferred', async (req, res) => {
  const { login, product_id, product_name, product_price, product_category, product_photo_id } = req.body;

  try {
    const checkQuery = 'SELECT * FROM Deferred WHERE product_id = $1 AND user_login = $2';
    const checkValues = [product_id, login];
    const checkResult = await client.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      const existingRecord = checkResult.rows[0];
      const newCount = Number(existingRecord.count) + 1;

      const updateQuery = 'UPDATE Deferred SET count = $1 WHERE id = $2';
      const updateValues = [newCount, existingRecord.id];
      await client.query(updateQuery, updateValues);

      res.status(200).json({ message: 'Количество обновлено', count: newCount });
    } else {
      const insertQuery = 'INSERT INTO Deferred (product_id, product_name, product_price, product_category, product_photo_id, user_login, count) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const insertValues = [product_id, product_name, product_price, product_category, product_photo_id, login, 1];
      await client.query(insertQuery, insertValues);

      res.status(201).json({ message: 'Товар успешно добавлен в отложенное!' });
    }
  } catch (error) {
    console.error('Ошибка при добавлении в отложенное', error.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка отложенных
app.post('/getDeferred', async (req, res) => {
  const { login } = req.body;

  try {
    const result = await client.query('SELECT * FROM Deferred WHERE user_login = $1', [login]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении отложенного:', error);
    res.status(500).json({ error: 'Ошибка при получении отложенного' });
  }
});

// Удаление товара из отложенного
app.delete('/delDeferred', async (req, res) => {
  const { login, product_id } = req.body;

  try {
    const checkQuery = 'SELECT * FROM Deferred WHERE product_id = $1 AND user_login = $2';
    const checkValues = [product_id, login];
    const checkResult = await client.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      const deleteQuery = 'DELETE FROM Deferred WHERE product_id = $1 AND user_login = $2';
      const deleteValues = [product_id, login];
      await client.query(deleteQuery, deleteValues);

      res.status(200).json({ message: 'Product removed from deferred list' });
    } else {
      res.status(404).json({ message: 'Product not found in deferred list' });
    }
  } catch (error) {
    console.error('Error executing query', error.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавление товара в корзину
app.post('/addBasket', async (req, res) => {
  const { login, product_id, product_name, product_price, product_category, product_photo_id } = req.body;

  try {
    const checkQuery = 'SELECT * FROM Basket WHERE product_id = $1 AND user_login = $2';
    const checkValues = [product_id, login];
    const checkResult = await client.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      const existingRecord = checkResult.rows[0];
      const newCount = Number(existingRecord.count) + 1;

      const updateQuery = 'UPDATE Basket SET count = $1 WHERE id = $2';
      const updateValues = [newCount, existingRecord.id];
      await client.query(updateQuery, updateValues);

      res.status(200).json({ message: 'Count updated successfully', count: newCount });
    } else {
      const insertQuery = 'INSERT INTO Basket (product_id, product_name, product_price, product_category, product_photo_id, user_login, count) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const insertValues = [product_id, product_name, product_price, product_category, product_photo_id, login, 1];
      await client.query(insertQuery, insertValues);

      res.status(201).json({ message: 'Товар добавлен в корзину!' });
    }
  } catch (error) {
    console.error('Ошибка при добавлении в корзину ', error.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка товаров в корзине
app.post('/getBasket', async (req, res) => {
  const { login } = req.body;

  try {
    const result = await client.query('SELECT * FROM Basket WHERE user_login = $1', [login]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении корзины:', error);
    res.status(500).json({ error: 'Ошибка при получении корзины' });
  }
});

// Удаление товара из корзины
app.delete('/delBasket', async (req, res) => {
  const { login, product_id } = req.body;

  try {
    const checkQuery = 'SELECT * FROM Basket WHERE product_id = $1 AND user_login = $2';
    const checkValues = [product_id, login];
    const checkResult = await client.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      const deleteQuery = 'DELETE FROM Basket WHERE product_id = $1 AND user_login = $2';
      const deleteValues = [product_id, login];
      await client.query(deleteQuery, deleteValues);

      res.status(200).json({ message: 'Товар удален из корзины!' });
    } else {
      res.status(404).json({ message: 'Товар не найден!' });
    }
  } catch (error) {
    console.error('Ошибка при удалении из корзины', error.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавление товара в доставку
app.post('/addDelivery', async (req, res) => {
  const { login, product_id, product_name, product_price, product_category } = req.body;

  const statuses = ['В пути', 'В обработке', 'Передается в доставку', 'Доставлено'];
  
  const getRandomStatus = () => {
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
  };

  try {
    const status = getRandomStatus();

    const insertQuery = 'INSERT INTO Delivery (product_id, product_name, product_price, product_category, status, user_login) VALUES ($1, $2, $3, $4, $5, $6)';
    const insertValues = [product_id, product_name, product_price, product_category, status, login];
    await client.query(insertQuery, insertValues);

    res.status(201).json({ message: 'Товар успешно приобретен!' });
  
  } catch (error) {
    console.error('Ошибка при покупке товара: ', error.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка товаров в доставке
app.post('/getDelivery', async (req, res) => {
  const { login } = req.body;

  try {
    const result = await client.query('SELECT * FROM Delivery WHERE user_login = $1', [login]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении доставки:', error);
    res.status(500).json({ error: 'Ошибка при получении доставки' });
  }
});

// Добавление товара
app.post('/addProduct', async (req, res) => {
  const { login, price, name, category } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO Products (name, price, user_key, category, photo_id, likes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, price, login, category, 1, 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении товара:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение кол-во товаров в избранном
app.post('/getCountDeferred', async (req, res) => {
  const { login } = req.body;

  try {
    const result = await client.query('SELECT COUNT(*) AS count FROM Deferred WHERE user_login = $1', [login]);
    
    const count = result.rows[0].count;

    res.json({ count });
  } catch (error) {
    console.error('Ошибка при получении кол-во отложенного:', error);
    res.status(500).json({ error: 'Ошибка при получении отложенного' });
  }
});

// Получение кол-во товаров в доставке
app.post('/getCountDelivery', async (req, res) => {
  const { login } = req.body;

  try {
    const result = await client.query('SELECT COUNT(*) AS count FROM Delivery WHERE user_login = $1', [login]);
    
    const count = result.rows[0].count;

    res.json({ count });
  } catch (error) {
    console.error('Ошибка при получении кол-во доставки:', error);
    res.status(500).json({ error: 'Ошибка при получении доставки' });
  }
});

// Получение бонусов
app.post('/getBonus', async (req, res) => {
  const { login } = req.body;

  try {
    const result = await client.query('SELECT * FROM bonus WHERE user_login = $1', [login]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении бонусов:', error);
    res.status(500).json({ error: 'Ошибка при получении бонусов' });
  }
});

// Получение бонусов
app.post('/getAds', async (req, res) => {
  const { ad_key_id } = req.body;

  try {
    const result = await client.query('SELECT * FROM bonus WHERE id = $1', [ad_key_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении рекламы:', error);
    res.status(500).json({ error: 'Ошибка при получении рекламы' });
  }
});

http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(portHttp, () => {
  console.log(`HTTP запущен на порту - ${portHttp}`);
});

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.glimshop.ru/privkey.pem'), 
  cert: fs.readFileSync('/etc/letsencrypt/live/api.glimshop.ru/cert.pem'), 
  ca: fs.readFileSync('/etc/letsencrypt/live/api.glimshop.ru/fullchain.pem')
};

https.createServer(sslOptions, app).listen(portHttps, () => {
  console.log(`HTTPS запущен на порту - ${portHttps}`);
});
