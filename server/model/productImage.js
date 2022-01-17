
function productImage(productId, imageName, imageDescription1, imageDescription2, imageUrl) {
    this.id = -1;
    this.productId = productId;
    this.imageName = imageName;
    this.imageDescription1 = imageDescription1;
    this.imageDescription2 = imageDescription2;
    this.imageUrl = imageUrl;
    this.active = true;
}

exports.emptyProductImage = () => {
    return new productImage();
}

exports.createProductImage = function (productId, imageName, imageDescription1, imageDescription2, imageUrl) {
    let newProductImage = new productImage(productId, imageName, imageDescription1, imageDescription2, imageUrl);
    newProductImage.id = -1;
    return newProductImage;
}

exports.ormProductImage = function(productImageRow) {
    let productImage = exports.emptyProductImage();
    productImage.id = productImageRow.id;
    productImage.productId = productImageRow.product_id;
    productImage.imageName = productImageRow.image_name;
    productImage.imageDescription1 = productImageRow.image_description_1;
    productImage.imageDescription2 = productImageRow.image_description_2;
    productImage.imageUrl = productImageRow.image_url;
    productImage.active = productImageRow.active;
    return productImage;
}