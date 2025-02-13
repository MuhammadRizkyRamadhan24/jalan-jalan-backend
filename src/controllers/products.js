const productModel = require("../models/products");
const {Op} = require("sequelize");
const airlineModel = require("../models/airline");
const destinationModel = require("../models/destination");
const classModel = require("../models/class");
const facilityModel = require("../models/facility");
const productFacilityModel = require("../models/productFacility");
// const destinationModels = require("../models/destination");
const {APP_URL} = process.env;

exports.createProducts = async (req, res) => {
	const {
		id_airline,
		id_destination,
		day,
		date,
		month,
		years,
		time_leave,
		time_arrive,
		transit,
		price,
		code,
		terminal,
		gate,
		id_class,
	} = req.body;

	if(price < 50000){
		return res.json({
			success: false,
			message : "Product Price must more than rp.50000"
		});
	}
	const data = {
		id_airline : id_airline,
		id_destination : id_destination,
		day:day,
		date:date,
		month:month,
		years:years,
		time_leave:time_leave,
		time_arrive:time_arrive,
		transit: transit,
		price: price,
		code: code,
		terminal: terminal,
		gate: gate,
		id_class: id_class,
		deletedBy: 0
	};
	try{
		const result = await productModel.create(data);
		const facility = {productId: result.id, facilityId: req.body.facility};
		const facilitydata = await productFacilityModel.create(facility);
		return res.json({
			success: true,
			message : "Product Created Succesfully",
			results: result,
			resultsFacility: facilitydata
		});
	}catch(err){
		console.log(err);
		return res.json({
			success: false,
			message : "Product Created failed",
			err: err,
		});
	}
};



exports.getDetailProductById = async (req,res) => {
	const {id} = req.params;
	try{
		const data = await productModel.findAll({
			where : {
				id: id,
				deletedBy: 0
			},
			include: [{
				model: airlineModel,
				as : "airline",
				attributes: ["id","name","picture", "extra_price"]   
			},
			{
				model: destinationModel,
				as : "destination" ,
				attributes: {
					exclude: ["createdAt", "updatedAt"]
				} 
			},
			{
				model: classModel,
				as : "class",  
				attributes: {
					exclude: ["createdAt", "updatedAt"]
				} 
			},
			{
				model: productFacilityModel,
				include:{
					model: facilityModel,
					attributes: {
						exclude: ["createdAt", "updatedAt"]
					}
				},
				attributes: {
					exclude: ["productId","facilityId","createdAt", "updatedAt"]
				} 
			},
			],
		});
		return res.json({
			success: true,
			message: `Detail Product of id: ${id} `,
			results: data
		});
	}catch(err){
		console.log(err);
		return res.json({
			success: false,
			message: "product not found",
			err: err,
		});
	}
};


exports.deleteProducts = async (req, res) => {
	const {id} = req.params;
	try{
		const data = await productModel.findOne({
			where: {
				id: id,
				deletedBy: 0
			}
		});
		data.set({
			deletedBy: 1
		});
		await data.save();
		return res.json({
			success: true,
			message: "deleted product succesfully",
			results: data,
		});
	}catch(err){
		return res.json({
			success: false,
			message: "deleted product failed",
			err: err,
		});
	}
};

exports.UpdateProducts = async (req, res) => {
	const {id} = req.params;
	try{
		const data = await productModel.findOne({
			where: {
				id: id,
				deletedBy: 0
			}
		});
		data.set(req.body);
		await data.save();
		return res.json({
			success: true,
			message: "Updated product succesfully",
			results: data,
		});
	}catch(err){
		return res.json({
			success: false,
			message: "Updated product failed",
			err: err,
		});
	}
};


exports.SearchProducts = async (req, res) => {
	const cond = req.query.search || "";
	const filterAirline = req.query.filterAirline || "";
	const filterPrice1 = req.query.filterPrice1 || 150000;
	const filterPrice2 = req.query.filterPrice2 || 250000;
	const filterDeparture1 = req.query.filterDeparture1 || "10:00";
	const filterArrive1 = req.query.filterArrive1 || "07:00";
	const filterTransit1 = req.query.filterTransit1 || "";
	const page = parseInt(req.query.page) || 1;
	const limits = parseInt(req.query.limit) || 5;
	try{
		const data = await productModel.findAll({
			where: {
				deletedBy: 0,
				[Op.and]:[
					{price: {
						[Op.between] : [filterPrice1,filterPrice2]
					}},
					{time_leave: {
						[Op.in] : [filterDeparture1]
					}},
					{time_arrive: {
						[Op.in] : [filterArrive1]
					}},
					{transit:{ 
						[Op.substring] : filterTransit1}},
				],
			},
			include: [{
				model: airlineModel,
				as : "airline",
				attributes: ["id","name","picture", "extra_price"],
				where : {
					name: {
						[Op.substring] : filterAirline
					}
				},  
			},
			{
				model: destinationModel,
				as : "destination" ,
				attributes: {
					exclude: ["createdAt", "updatedAt"]
				},
				where: {
					[Op.or]:[
						{destination_city: {
							[Op.substring] : cond
						}},
						{destination_country: {
							[Op.substring] : cond
						}},
					]
				},
			},
			{
				model: classModel,
				as : "class",  
				attributes: {
					exclude: ["createdAt", "updatedAt"]
				} 
			},
			{
				model: productFacilityModel,
				include:{
					model: facilityModel,
					attributes: {
						exclude: ["createdAt", "updatedAt"]
					},
				},
				attributes: {
					exclude: ["productId","facilityId","createdAt", "updatedAt"]
				},
			},
			],
			attributes: {
				exclude: ["createdAt", "updatedAt"]
			}, 
			limit: limits,
			offset: (page - 1) * limits,
		});
		const datapage = await productModel.count({
			where: {
				deletedBy: 0,
				[Op.and]:[
					{price: {
						[Op.between] : [filterPrice1,filterPrice2]
					}},
					{transit:{ 
						[Op.substring] : filterTransit1}},
					{time_arrive: {
						[Op.in] : [filterArrive1]
					}},
					{time_leave: {
						[Op.in] : [filterDeparture1]
					}},
				],
			},
			include: [{
				model: airlineModel,
				as : "airline",
				attributes: ["id","name","picture", "extra_price"],
				where : {
					name: {
						[Op.substring] : filterAirline
					}
				},  
			},
			{
				model: destinationModel,
				as : "destination" ,
				attributes: {
					exclude: ["createdAt", "updatedAt"]
				},
				where: {
					[Op.or]:[
						{destination_city: {
							[Op.substring] : cond
						}},
						{destination_country: {
							[Op.substring] : cond
						}},
					]
				},
			},
			{
				model: classModel,
				as : "class",  
				attributes: {
					exclude: ["createdAt", "updatedAt"]
				} 
			},
			],
			attributes: {
				exclude: ["createdAt", "updatedAt"]
			}, 
		});
		const totalPage = Math.ceil((datapage) / limits);
		const pagination = {
			totaldata: datapage,
			currentPage: page,
			totalPage: totalPage,
			limitData: limits,
			nextPage : page < totalPage ? `${APP_URL}/products?search=${cond}&page=${page + 1}` : null,
			prevPage : page > 1 ? `${APP_URL}/products?search=${cond}&page=${page - 1}` : null
		};
		const finaldata = data;
		if(finaldata.length >= 1){
			return res.json({
				success: true,
				message: "List product",
				results: finaldata,
				pageInfo: pagination
			});
		}else{
			return res.json({
				success: false,
				message: "product Not Found",
			});
		}
	}catch(err){
		console.log(err);
		return res.json({
			success: false,
			message: "Product not found! catch",
			err: err,
		});
	}
};
