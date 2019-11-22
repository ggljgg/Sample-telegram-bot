# Sample-telegram-bot

Образец простого бота для поиска ближайших кинотеатров и просмотра их киноафиш.

Пример структуры заглушечного файла database.json для демонстрации работы:

JSON
----
```json
{
    "films": [
        {
            "uuid": "f001",
            "name": "Начало",
            "type": "action",
            "year": 2010,
            "rate": 8.665,
            "length": "148 мни. / 02:28",
            "country": "США",
            "link": "https://www.kinopoisk.ru/film/447301/",
            "picture": "https://st.kp.yandex.net/images/film_big/447301.jpg",
            "cinemas": ["c001", "c003", "c005"]
        },
        {
            "uuid": "f002",
            "name": "Гладиатор",
            "type": "action",
            "year": 2002,
            "rate": 8.6,
            "length": "155 мин. / 02:35",
            "country": "США",
            "link": "https://www.kinopoisk.ru/film/474/",
            "picture": "https://www.kinopoisk.ru/images/film_big/474.jpg",
            "cinemas": ["c001", "c002", "c004"]
        },
        {
            "uuid": "f003",
            "name": "1+1",
            "type": "comedy",
            "year": 2011,
            "rate": 8.809,
            "length": "112 мин. / 01:52",
            "country": "Франция",
            "link": "https://www.kinopoisk.ru/film/535341/",
            "picture": "https://www.kinopoisk.ru/images/film_big/535341.jpg",
            "cinemas": ["c002", "c003", "c004"]
        },
        {
            "uuid": "f004",
            "name": "Назад в будущее",
            "type": "comedy",
            "year": 1985,
            "rate": 8.625,
            "length": "116 мин. / 01:56",
            "country": "Франция",
            "link": "https://www.kinopoisk.ru/film/476/",
            "picture": "https://www.kinopoisk.ru/images/film_big/476.jpg",
            "cinemas": ["c005", "c003", "c004"]
        }
    ],
    "cinemas": [
        {
            "uuid": "c001",
            "name": "Звёздочка",
            "location": {
                "latitude": 48.013635,
                "longitude": 37.799504
            },
            "url": "http://kino.dn.ua/",
            "films": ["f001", "f002"]
        },
        {
            "uuid": "c002",
            "name": "Дом Кино \"Шевченко\"",
            "location": {
                "latitude": 48.005740,
                "longitude": 37.805067
            },
            "url": "https://domkino.com.ru/",
            "films": ["f002", "f003"]
        },
        {
            "uuid": "c003",
            "name": "Фунтура Синема",
            "location": {
                "latitude": 48.030513,
                "longitude": 37.788341
            },
            "url": "https://funtura-cinema.ru/",
            "films": ["f001", "f003", "f004"]
        },
        {
            "uuid": "c004",
            "name": "World Cinema Plus",
            "location": {
                "latitude": 50.840203,
                "longitude": 37.305378
            },
            "url": "https://world-cinema.com",
            "films": ["f002", "f003", "f004"]
        },
        {
            "uuid": "c005",
            "name": "The Greatest Cinema",
            "location": {
                "latitude": 54.403103,
                "longitude": 30.305678
            },
            "url": "https://greatest-cinema.com",
            "films": ["f001", "f004"]
        }
    ]
}
```
