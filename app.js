const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//lodash --> "_"
const _ = require("lodash");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
//for using the style sheets we use explicitly create this thing for express
app.use(express.static("public"));

app.set('view engine', 'ejs');

// let items = ["Buy Food", "Cook Food", "Eat Food"];
// let workItems = [];    instead of this we use the mongoDB database


// for avoiding the deprecating warning
mongoose.set('strictQuery', true);
// connection to the mongodb port server
// mongoose.connect("mongodb+srv://saikiran_maragouni:sahithya@cluster0.xtp3wfs.mongodb.net/todoListDB");
mongoose.connect("mongodb+srv://"+process.env.ADMIN_NAME +":"+process.env.ADMIN_PASS+"cluster0.xtp3wfs.mongodb.net/todoListDB", {useNewUrlParser: true});

//Schema for the database
const itemSchema = new mongoose.Schema({
  name: String
});

//model for the schema
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "welcome to todolist"
});
const item2 = new Item({
  name: "Hit the + button to aff a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Schema for the custom routes
const listSchema = {
  name: String,
  items: [itemSchema]
};
// model for the custom routes schema
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //for accesing the values from the database
  Item.find({}, function (err, foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err)
          console.log(err);
        else
          console.log("succesfully saved defauld to database");
      });
      res.redirect("/");
    }
    else {
      res.render('list', { listTitle: "Today", newListItems: foundItems });
    }

  });
});


//dynamin route 
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // console.log("Does't Exist");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        // console.log("exits");
        res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  })


});

//for deleting when the checkbox is checked
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err)
        console.log(err);
      else
        console.log("sucessfully deleted");
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name : listName}, {$pull: {items : {_id : checkedItemId } } }, function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
  
});


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const nnitem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    nnitem.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}, function(err,foundList){
      foundList.items.push(nnitem);
    foundList.save();
    res.redirect("/"+ listName);
    });
  }



});







app.get("/about", function (req, res) {
  res.render('about');
});

if (port == null || port == "") {
  port = 3000
} 
app.listen(port, function () {
  console.log("server started on port 3000");
});
