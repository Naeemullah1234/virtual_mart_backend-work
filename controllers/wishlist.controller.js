const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");
const Cart = require("../models/cart.model");


const addToWishlist = async (req, res) => {
  try {

  const { productId } = req.body;

if (!productId) {
  return res.status(400).json({ success: false,message: "Product ID is required.",});}

const product = await Product.findOne({ _id: productId,isActive: true, isDeleted: false,});

if (!product) {
  return res.status(404).json({success: false, message: "Product not found.",});}


let wishlist = await Wishlist.findOne({ customer: req.user._id,});

if (!wishlist) {

  wishlist = await Wishlist.create({ customer: req.user._id, products: [],});}

const alreadyExists = wishlist.products.some( (item) => item.toString() === productId);

if (alreadyExists) {
  return res.status(400).json({ success: false, message: "Product already exists in wishlist.",});}


wishlist.products.push(product._id);

await wishlist.save();


res.status(201).json({ success: true, message: "Product added to wishlist successfully.", wishlistCount: wishlist.products.length,});


  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error", }); }};


const getWishlist = async (req, res) => {
  try {

    const wishlist = await Wishlist.findOne({

  customer: req.user._id,
}).populate({ path: "products", select: "name slug images price salePrice stock isActive isDeleted",});

if (!wishlist) {

  return res.status(200).json({ success: true, wishlist: { products: [],totalItems: 0,},});}

const validProducts = wishlist.products.filter( (product) => product && product.isActive && !product.isDeleted);

if (validProducts.length !== wishlist.products.length) {

  wishlist.products = validProducts.map(
    (product) => product._id
  );

  await wishlist.save();

}

res.status(200).json({ success: true,wishlist: { products: validProducts, totalItems: validProducts.length, },});

  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});} };

const removeFromWishlist = async (req, res) => {
  try {

    const { productId } = req.params;

if (!productId) {
  return res.status(400).json({ success: false, message: "Product ID is required.",});}

const wishlist = await Wishlist.findOne({ customer: req.user._id,});

if (!wishlist) {
  return res.status(404).json({ success: false, message: "Wishlist not found.", });}

const productExists = wishlist.products.some( (item) => item.toString() === productId );

if (!productExists) {
  return res.status(404).json({ success: false, message: "Product not found in wishlist.",});}

wishlist.products = wishlist.products.filter( (item) => item.toString() !== productId);

await wishlist.save();

res.status(200).json({ success: true,message: "Product removed from wishlist successfully.",totalItems: wishlist.products.length,});

  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});}};

const moveWishlistToCart = async (req, res) => {
  try {

const { productId } = req.params;

if (!productId) {
  return res.status(400).json({ success: false, message: "Product ID is required.", });}

const wishlist = await Wishlist.findOne({
  customer: req.user._id,
});

if (!wishlist) {
  return res.status(404).json({ success: false, message: "Wishlist not found.",});}

const existsInWishlist = wishlist.products.some( (item) => item.toString() === productId);

if (!existsInWishlist) {
  return res.status(404).json({ success: false, message: "Product not found in wishlist.",});}

const product = await Product.findOne({ _id: productId, isActive: true,isDeleted: false,});

if (!product) {
  return res.status(404).json({ success: false, message: "Product not found.", });}

let cart = await Cart.findOne({ customer: req.user._id,});

if (!cart) {

  cart = await Cart.create({ customer: req.user._id, items: [], });}


const existingItem = cart.items.find( (item) => item.product.toString() === productId );

if (existingItem) {

  existingItem.quantity += 1;

} else {

  cart.items.push({ product: product._id, quantity: 1,});}

wishlist.products = wishlist.products.filter( (item) => item.toString() !== productId);

await cart.save();

await wishlist.save();

res.status(200).json({ success: true,message: "Product moved to cart successfully.",});

  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});}};

module.exports = { addToWishlist,getWishlist,removeFromWishlist, moveWishlistToCart,};