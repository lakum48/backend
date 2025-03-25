const { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLInt, GraphQLString } = require('graphql');
const products = require('./products.json');

const ProductType = new GraphQLObjectType({
    name: 'Product',
    fields: {
        id: { type: GraphQLInt },
        name: { type: GraphQLString },
        price: { type: GraphQLInt },
        description: { type: GraphQLString },
        category: { type: GraphQLString }
    }
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        products: {
            type: new GraphQLList(ProductType),
            args: {
                fields: { type: GraphQLString },
                category: { type: GraphQLString },
                maxPrice: { type: GraphQLInt }
            },
            resolve(parent, args) {
                let filteredProducts = [...products];
                
                if (args.category) {
                    filteredProducts = filteredProducts.filter(
                        p => p.category.toLowerCase() === args.category.toLowerCase()
                    );
                }
                
                if (args.maxPrice) {
                    filteredProducts = filteredProducts.filter(
                        p => p.price <= args.maxPrice
                    );
                }
                
                if (args.fields) {
                    const fields = args.fields.split(',');
                    return filteredProducts.map(product => {
                        let result = {};
                        fields.forEach(field => {
                            if (product[field] !== undefined) {
                                result[field] = product[field];
                            }
                        });
                        return result;
                    });
                }
                
                return filteredProducts;
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery
});