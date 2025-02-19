
# README.md

```
Данный проект представляет собой серверное приложение,разработанное с использованием Node.js и Express.
Оно предоставляет API для управления пользователями и товарами, а также поддерживает функции аутентификации и работы с корзиной.
```

## Использование

### Основные маршруты

#### 1. **GET /**  
Возвращает сообщение о том, что сервер работает.

**Ответ:**
```json
{
  "message": "Приветствую, сервер работает в штатном режиме!"
}
```

#### 2. **POST /addUser **  
Добавляет нового пользователя.  

**Тело запроса:**
```json
{
  "login": "string",
  "fullname": "string",
  "address": "string",
  "phone_number": "string",
  "password": "string",
  "role": "string" // "Продавец" или "Покупатель"
}
```

**Ответ:**
- Успех (201):
  ```json
  {
    "message": "Пользователь успешно добавлен"
  }
  ```
- Ошибка (400):
  ```json
  {
    "error": "Такой логин уже существует!"
  }
  ```

#### 3. **POST /login**  
Аутентификация пользователя.  

**Тело запроса:**
```json
{
  "login": "string",
  "password": "string"
}
```

**Ответ:**
- Успех (200):
  ```json
  {
    "message": "Вход выполнен успешно!",
    "role": "string"
  }
  ```
- Ошибка (401):
  ```json
  {
    "error": "Неверный логин или пароль!"
  }
  ```

#### 4. **POST /getUser **  
Получение данных пользователя по логину.  

**Тело запроса:**
```json
{
  "login": "string"
}
```

**Ответ:**
- Успех (200):
  ```json
  {
    "fullname": "string",
    "address": "string",
    "phone_number": "string",
    "role": "number" // 0 или 1
  }
  ```
- Ошибка (404):
  ```json
  {
    "error": "Пользователь не найден!"
  }
  ```

#### 5. **POST /getProducts**  
Получение списка всех товаров.

**Ответ:**
- Успех (200):
  ```json
  [
    {
      "id": "number",
      "name": "string",
      "price": "number",
      "user_key": "string",
      "category": "string",
      "photo_id": "string"
    },
    ...
  ]
  ```
- Ошибка (404):
  ```json
  {
    "message": "Товары не найдены!"
  }
  ```

#### 6. **POST /addProduct**  
Добавление нового товара.  

**Тело запроса:**
```json
{
  "login": "string",
  "price": "number",
  "name": "string",
  "category": "string"
}
```

**Ответ:**
- Успех (201):
  ```json
  {
    "id": "number",
    "name": "string",
    "price": "number",
    "user_key": "string",
    "category": "string",
    "photo_id": "string",
    "likes": "number"
  }
  ```
- Ошибка (500):
  ```json
  {
    "error": "Внутренняя ошибка сервера"
  }
  ```

#### 7. **POST /addBasket**  
Добавление товара в корзину.  

**Тело запроса:**
```json
{
  "login": "string",
  "product_id": "number",
  "product_name": "string",
  "product_price": "number",
  "product_category": "string",
  "product_photo_id": "string"
}
```

**Ответ:**
- Успех (201):
  ```json
  {
    "message": "Товар добавлен в корзину!"
  }
  ```
- Ошибка (500):
  ```json
  {
    "error": "Внутренняя ошибка сервера"
  }
  ```

#### 8. **POST /getBasket**  
Получение списка товаров в корзине.  

**Тело запроса:**
```json
{
  "login": "string"
}
```

**Ответ:**
- Успех (200):
  ```json
  [
    {
      "id": "number",
      "product_id": "number",
      "product_name": "string",
      "product_price": "number",
      "product_category": "string",
      "product_photo_id": "string",
      "count": "number"
    },
    ...
  ]
  ```
- Ошибка (404):
  ```json
  {
    "error": "Ошибка при получении корзины"
  }
  ```

#### 9. **DELETE /delBasket**  
Удаление товара из корзины.  

**Тело запроса:**
```json
{
  "login": "string",
  "product_id": "number"
}
```

**Ответ:**
- Успех (200):
  ```json
  {
    "message": "Товар удален из корзины!"
  }
  ```
- Ошибка (404):
  ```json
  {
    "message": "Товар не найден!"
  }
  ```

#### 10. **POST /addDelivery**  
Добавление товара в доставку.  

**Тело запроса:**
```json
{
  "login": "string",
  "product_id": "number",
  "product_name": "string",
  "product_price": "number",
  "product_category": "string"
}
```

**Ответ:**
- Успех (201):
  ```json
  {
    "message": "Товар успешно приобретен!"
  }
  ```
- Ошибка (500):
  ```json
  {
    "error": "Внутренняя ошибка сервера"
  }
  ```

#### 11. **POST /getDelivery**  
Получение списка товаров в доставке.  

**Тело запроса:**
```json
{
  "login": "string"
}
```

**Ответ:**
- Успех (200):
  ```json
  [
    {
      "id": "number",
      "product_id": "number",
      "product_name": "string",
      "product_price": "number",
      "product_category": "string",
      "status": "string",
      "user_login": "string"
    },
    ...
  ]
  ```
- Ошибка (404):
  ```json
  {
    "error": "Ошибка при получении доставки"
  }
  ```

#### 12. **POST /getCountDeferred**  
Получение количества товаров в отложенном.  

**Тело запроса:**
```json
{
  "login": "string"
}
```

**Ответ:**
- Успех (200):
  ```json
  {
    "count": "number"
  }
  ```
- Ошибка (500):
  ```json
  {
    "error": "Ошибка при получении отложенного"
  }
  ```

#### 13. **POST /getCountDelivery**  
Получение количества товаров в доставке.  

**Тело запроса:**
```json
{
  "login": "string"
}
```

**Ответ:**
- Успех (200):
  ```json
  {
    "count": "number"
  }
  ```
- Ошибка (500):
  ```json
  {
    "error": "Ошибка при получении доставки"
  }
  ```

### Примечания

- Сервер поддерживает как HTTP, так и HTTPS.
- Для работы с базой данных используется PostgreSQL.
- Все пароли хранятся в зашифрованном виде с использованием MD5.

## Лицензия

Этот проект лицензирован под MIT License. 

## Контакты

```
Telegram: <a href = "https://t.me/inekruz/">НАПИСАТЬ</a>
Email: nekruz@nekruz.su
```
