const createError = require("http-errors");
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port: number = 8080;

let contacts = [
    {
        "id": 1,
        "name": "Pepito Pérez",
        "phone": "000-000-0000",
        "email": "pepito@salazarcodes.com"
    },
    {
        "id": 2,
        "name": "Stephanye D' Pérez",
        "phone": "123-456-7890",
        "email": "stephanye@salazarcodes.com"
    },
    {
        "id": 3,
        "name": "Nieves O.",
        "phone": "789-123-4567",
        "email": "nieves@salazarcodes.com"
    }
];

const isEmailValid = (email: string): boolean => {
    const regex = /\w.+@.+\.(|com|)/;
    return regex.test(email);
};

const isPhoneValid = (phone: string): boolean => {
    const regex = /\d{3}-?\d{3}-?\d{4}/;
    return regex.test(phone);
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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

app.get("/", (request, response) => {
    const options = {root: path.join(__dirname)};
    response.sendFile("index.html", options);
});

app.get("/contacts", (request, response) => {
    response.json(contacts);
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

app.post("/add", (request, response) => {
    if (!request.body) {
        response.json({error: "No data was provided."});
        return;
    }

    if (!request.body.name) {
        response.json({error: "Name was not specified."});
        return;
    }

    if (!request.body.phone) {
        response.json({error: "Phone was not specified."});
        return;
    } else if (!isPhoneValid(request.body.phone)) {
        response.json({error: `Phone: ${request.body.phone} is not valid.`});
        return;
    }

    if (!request.body.email) {
        response.json({error: "Email was not specified."});
        return;
    } else if (!isEmailValid(request.body.email)) {
        response.json({error: `Email ${request.body.email} is not valid.`});
        return;
    }

    let found = contacts.find((contact) => contact.name === request.body.name);
    if (found) {
        response.json({error: `Contact: ${request.body.name} already exists.`});
        return;
    }

    found = contacts.find((contact) => contact.email === request.body.email);
    if (found) {
        response.json({error: `Email: ${request.body.email} is already in use.`});
        return;
    }

    contacts.push({
        "id": contacts.length + 1,
        "name": request.body.name,
        "phone": request.body.phone,
        "email": request.body.email
    });

    response.json({success: `Contact ID: ${contacts.length}`});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});
