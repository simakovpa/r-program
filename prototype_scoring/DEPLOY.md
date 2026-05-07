# Развёртывание на GitHub Pages

## Инструкция по подключению прототипа к GitHub Pages

### Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на https://github.com
2. Создайте новый репозиторий (например, `prototype_scoring`)
3. Не инициализируйте его README, .gitignore или лицензией (если репозиторий пустой)

### Шаг 2: Настройте package.json

Откройте файл `package.json` и измените поле `homepage` на ваш URL:

```json
"homepage": "https://your-username.github.io/prototype_scoring"
```

Замените `your-username` на ваше имя пользователя GitHub.

### Шаг 3: Инициализируйте Git и запушьте код

Выполните команды в терминале:

```bash
cd /workspace/prototype_scoring

# Инициализация git (если ещё не инициализирован)
git init

# Добавление всех файлов
git add .

# Первый коммит
git commit -m "Initial commit - scoring prototype"

# Добавьте удалённый репозиторий (замените your-username на ваш логин)
git remote add origin https://github.com/your-username/prototype_scoring.git

# Отправка кода в основную ветку
git branch -M main
git push -u origin main
```

### Шаг 4: Развёртывание на GitHub Pages

Выполните команду для деплоя:

```bash
npm run deploy
```

Эта команда:
1. Сначала выполнит `npm run build` (создаст оптимизированную сборку в папке `dist`)
2. Затем опубликует содержимое `dist` в ветку `gh-pages`

### Шаг 5: Настройте GitHub Pages

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Pages**
3. В разделе **Build and deployment**:
   - **Source**: Выберите `Deploy from a branch`
   - **Branch**: Выберите `gh-pages` и папку `/ (root)`
4. Нажмите **Save**

### Шаг 6: Доступ к прототипу

Через 1-2 минуты после деплоя ваш прототип будет доступен по адресу:

```
https://your-username.github.io/prototype_scoring/
```

---

## Обновление прототипа

После внесения изменений в код:

```bash
# Закоммитьте изменения
git add .
git commit -m "Описание изменений"
git push

# И заново разверните
npm run deploy
```

---

## Альтернатива: Vercel / Netlify (проще!)

Если вы хотите более быстрый способ без настройки GitHub Pages:

### Vercel:
1. Зайдите на https://vercel.com
2. Импортируйте репозиторий с GitHub
3. Vercel автоматически определит Vite и настроит сборку
4. Сайт будет доступен по адресу `https://prototype-scoring.vercel.app`

### Netlify:
1. Зайдите на https://netlify.com
2. Перетащите папку `dist` в окно браузера (Drag & Drop)
3. Или подключите репозиторий GitHub для автодеплоя

---

## Локальный просмотр

Для просмотра локально используйте:

```bash
npm run dev      # Режим разработки с hot-reload
npm run preview  # Предпросмотр продакшн-сборки
```
