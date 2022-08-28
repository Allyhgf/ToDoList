//Inicilização de bibliotecas
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//Front e backend inicializados
const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Esquema da database default
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
}
const Item = mongoose.model("item", itemsSchema);

const item1 = new Item ({
  name: "Item1"
})
const item2 = new Item ({
  name: "Item2"
})
const item3 = new Item ({
  name: "Item3"
})

const defaultItems = [item1, item2, item3];

//Esquema database custom

const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);

//Server do site
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        err ? console.log(err) : console.log("Succesfully inserted.")
      })
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })

});

//Adicionar items nas listas
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    })
  }

});

//Remover itens das listas
app.post("/delete", function(req,res){
  
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      err ? console.log(err) : console.log("Item succesfully deleted.")
      res.redirect("/");
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, deletedItem){
      if (!err){
        res.redirect(`/${listName}`);
      }
    })
  }

})

//Levar o usuário para lista custom
app.get("/:customListName", function(req,res){
  
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList){
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect(`/${customListName}`);
      } else {
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  })

})

app.get("/about", function(req, res){
  res.render("about");
});

//Definir a port do servidor e conectar
app.listen(3000, function() {
  console.log("Server started on port 3000");
});