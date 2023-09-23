//jshint esversion:6
//Document array
let items;
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { redirect } = require("express/lib/response");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//connect to mogoDB Sever

async function connectToMongodb() {
  try {
    const localUrl = "mongodb://127.0.0.1:27017/todoListDB";
    const url =
      "mongodb+srv://admin:admin@cluster0.gfrld7d.mongodb.net/todoListDB?retryWrites=true&w=majority";
    await mongoose.connect(url);
    console.log("Scussfully connect to the mongoDB server");
  } catch (error) {
    console.log("Connection faild => " + error);
  }

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

connectToMongodb();
//defining schemas
const itemsSchema = new mongoose.Schema({
  name: String,
});
const customTodoListSchema = new mongoose.Schema({
  todoListName: String,
  items: [itemsSchema],
});

//creating schemas
const Item = mongoose.model("Home_Page_Collection", itemsSchema);
const CustomTodoList = mongoose.model(
  "Custom_TodoList_Collection",
  customTodoListSchema
);

const DefaultObj = [
  { name: "Preapare breakfast" },
  { name: "Watering flowers" },
  { name: "Go to gym" },
];
// deleting and item
async function deleteDocument(condition, model) {
  try {
    await model.findOneAndDelete(condition);
    console.log("Item deleted successfully");
  } catch (error) {
    console.log("Ther is an error in deleting => " + error);
  }
}
async function fetechItems(model, query, DefaultObj) {
  try {
    const objArray = await model.find(query);

    if (objArray.length == 0) {
      insertDocument(DefaultObj, model);
      console.log("inserted default values complete => " + DefaultObj);
    }
    console.log("Succssfully get values");
    return objArray;
  } catch (error) {
    console.log("Error occur in fetching items => " + error);
  }
}

async function insertDocument(obj, model) {
  try {
    await model.insertMany(obj);

    console.log("Succssfully inserted values");
  } catch (error) {
    console.log("There is an error inserting values => " + error);
  }
}
const day = date.getDate();
app.get("/", async function (req, res) {
  await fetechItems(Item, {}, DefaultObj).then((objArray) => {
    console.log(objArray);
    items = objArray;
  });

  if (items.length == 0) {
    res.redirect("/");
  }

  res.render("list", {
    listTitle: "Today",
    items: items,
    listName: "main",
  });
});

app.post("/", async function (req, res) {
  const newItemAdded = _.capitalize(req.body.newItem);
  const item = [{ name: newItemAdded }];

  if (req.body.listName === "main") {
    insertDocument(item, Item);
    res.redirect("/");
  } else {
    const todoListName = req.body.listName;
    const newItem = new Item({ name: newItemAdded });
    console.log("This is new item =>" + newItem);
    try {
      const result = await CustomTodoList.updateOne(
        { todoListName: todoListName }, // Filter criteria
        { $push: { items: newItem } } // Update operation using $push to add newItem to the 'items' array
      );
      res.redirect("/" + todoListName);
      console.log("Sucessfully inserted to " + todoListName);
    } catch (error) {
      console.log(
        "There is an error occur adding item to array in todo list " +
          todoListName +
          " error=> " +
          error
      );
    }
  }
});

app.post("/delete", async function (req, res) {
  const itemId = req.body.checkBox;
  const todoListName = req.body.todoListName;

  if (todoListName == "Today") {
    const condition = { _id: itemId };
    await deleteDocument(condition, Item);
    res.redirect("/");
  } else {
    const documentName = todoListName; // Replace with the name of your document
    const itemIdToRemove = itemId; // Replace with the _id of the item to remove

    // Use the updateOne method to remove the item from the array
    try {
      const result = await CustomTodoList.updateOne(
        { todoListName: documentName }, // Filter criteria to match the document
        { $pull: { items: { _id: itemIdToRemove } } }
      ); // Use $pull to remove the item by _id
      console.log("Succesfully deleted" + result);
    } catch (error) {
      console.log("There is an error occur in deleting the item " + error);
      res.redirect("/");
    }

    res.redirect("/" + todoListName);
  }
});

app.get("/:newList", async (req, res) => {
  const cleanedInput = _.replace(req.params.newList, /[^A-Za-z]/g, "");
  const newListName = _.capitalize(cleanedInput);

  const DefaultObjN = [{ todoListName: newListName, items: DefaultObj }];
  //check wheter the given todo list is already exist in the database when user sent the request

  await fetechItems(
    CustomTodoList,
    { todoListName: newListName },
    DefaultObjN
  ).then((objArray) => {
    console.log(objArray);
    itemsArray = objArray;
  });

  if (itemsArray.length == 0) {
    res.redirect("/" + newListName);
  } else {
    res.render("list", {
      listTitle: newListName,
      items: itemsArray[0].items,
      listName: newListName,
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
