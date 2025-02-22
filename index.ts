const createError = require("http-errors");
const express = require("express");
const app = express();
const port: number = 8000;

let contacts = [
    {
        "id": 1,
        "name": "Pepito Pérez",
        "phone": "000-000-0000",
        "email": "pepito@salzarcodes.com"
    },
    {
        "id": 2,
        "name": "Stephanye D' Pérez",
        "phone": "123-456-7890",
        "email": "stephanye@salzarcodes.com"
    },
    {
        "id": 3,
        "name": "Nieves O.",
        "phone": "789-123-4567",
        "email": "nieves@salzarcodes.com"
    }
];

app.param("id", (request, response, next, id) => {
    if (typeof id === "undefined") {
        next(createError(404, "User not found!"));
    }

    request.id = parseInt(id);
    if (isNaN(request.id)) {
        next(createError(400, `ID: ${id} is not valid.`));
    }

    --request.id;

    if (request.id < 0 || request.id >= contacts.length) {
        next(createError(404, `ID: ${id} not found!`));
    }

    next();
});

app.get("/contacts", (request, response) => {
    let c = [];
    for (const contact of contacts) {
        c.push({
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email
        });
    }

    response.json(c);
});

app.get("/contact/:id", (request, response) => {
    const contact = {
        "id": contacts[request.id].id,
        "name": contacts[request.id].name,
        "phone": contacts[request.id].phone,
        "email": contacts[request.id].email,
    };

    response.json(contact);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});
