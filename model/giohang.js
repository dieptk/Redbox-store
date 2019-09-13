function GioHang (oldCart){
	this.items = oldCart.items || {};
	for(var id in this.items){
		this.items[id].item.quantity = this.items[id].item.st;
		this.items[id].item.description = this.items[id].item.des;
		this.items[id].item.currency = "SAR";
		this.items[id].item.unitPrice = this.items[id].item.price;
	}
	console.log("items",this.items);

	this.add = function(id, item){
		var giohang = this.items[id];

		if(!giohang){
			giohang = this.items[id] = {item: item, soluong: 0, tien: 0}
		}
		giohang.soluong++;
		giohang.tien = giohang.soluong * giohang.item.price;
	}

	this.convertArray = function(){
		var arr = [];
		for(var id in this.items){
			arr.push(this.items[id]);
		}

		return arr;
	}

	this.updateCart = function(id, soluong){

		var giohang = this.items[id];
		giohang.soluong = soluong;
		giohang.tien = giohang.item.price * soluong;

		//console.log(giohang);
	}

	this.delCart = function(id){
		delete this.items[id];
	}
}

module.exports = GioHang;
