from flask import Flask, jsonify, request
from pymongo import MongoClient
from bson import ObjectId # Para manejar los IDs de MongoDB
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)

# --- Configuración de MongoDB ---
client = MongoClient('mongodb://localhost:27017/')
db = client['tienda_ropa_db']
productos_collection = db['productos']

# --- Datos de ejemplo (para insertar si la colección está vacía) ---
def popular_db_si_vacia():
    if productos_collection.count_documents({}) == 0:
        productos_ejemplo = [
            {
                "nombre": "Camiseta Clásica",
                "descripcion": "Camiseta de algodón cómoda y versátil.",
                "precio": 19.99,
                "tallas": ["S", "M", "L", "XL"],
                "colores": ["Blanco", "Negro", "Azul"],
                "imagen_url": "https://via.placeholder.com/300x300.png?text=Camiseta",
                "stock": 100
            },
            {
                "nombre": "Jeans Slim Fit",
                "descripcion": "Pantalones vaqueros modernos y ajustados.",
                "precio": 49.99,
                "tallas": ["28", "30", "32", "34"],
                "colores": ["Azul Oscuro", "Negro"],
                "imagen_url": "https://via.placeholder.com/300x300.png?text=Jeans",
                "stock": 50
            },
            {
                "nombre": "Sudadera con Capucha",
                "descripcion": "Sudadera abrigada ideal para el día a día.",
                "precio": 35.50,
                "tallas": ["M", "L", "XL"],
                "colores": ["Gris", "Negro"],
                "imagen_url": "https://via.placeholder.com/300x300.png?text=Sudadera",
                "stock": 75
            }
        ]
        productos_collection.insert_many(productos_ejemplo)
        print("Base de datos populada con productos de ejemplo.")


@app.route('/api/productos', methods=['POST'])
def add_producto():
    try:
        data = request.get_json()
        if not data or not data.get('nombre') or not data.get('precio') or not data.get('stock'):
            return jsonify({"error": "Nombre, precio y stock son requeridos"}), 400
        
        try:
            data['precio'] = float(data['precio'])
            data['stock'] = int(data['stock'])
        except ValueError:
            return jsonify({"error": "Precio debe ser un número y stock un entero"}), 400

        data.setdefault('descripcion', '')
        data.setdefault('tallas', [])
        data.setdefault('colores', [])
        data.setdefault('imagen_url', 'https://via.placeholder.com/150x150.png?text=Producto')

        resultado = productos_collection.insert_one(data)
        nuevo_producto = productos_collection.find_one({'_id': resultado.inserted_id})
        nuevo_producto['_id'] = str(nuevo_producto['_id'])
        return jsonify(nuevo_producto), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/productos', methods=['GET'])
def get_productos():
    try:
        productos = []
        for producto in productos_collection.find():
            producto['_id'] = str(producto['_id'])
            productos.append(producto)
        return jsonify(productos)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/productos/<id_producto>', methods=['GET'])
def get_producto(id_producto):
    try:
        producto = productos_collection.find_one({'_id': ObjectId(id_producto)})
        if producto:
            producto['_id'] = str(producto['_id'])
            return jsonify(producto)
        else:
            return jsonify({"error": "Producto no encontrado"}), 404
    except Exception as e: 
        return jsonify({"error": "ID de producto inválido o error interno"}), 400

@app.route('/api/productos/<id_producto>', methods=['PUT'])
def update_producto(id_producto):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

        if 'precio' in data:
            try:
                data['precio'] = float(data['precio'])
            except ValueError:
                return jsonify({"error": "Precio debe ser un número"}), 400
        if 'stock' in data:
            try:
                data['stock'] = int(data['stock'])
            except ValueError:
                return jsonify({"error": "Stock debe ser un entero"}), 400

        resultado = productos_collection.update_one(
            {'_id': ObjectId(id_producto)},
            {'$set': data}
        )
        if resultado.matched_count > 0:
            producto_actualizado = productos_collection.find_one({'_id': ObjectId(id_producto)})
            producto_actualizado['_id'] = str(producto_actualizado['_id'])
            return jsonify(producto_actualizado)
        else:
            return jsonify({"error": "Producto no encontrado para actualizar"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/productos/<id_producto>', methods=['DELETE'])
def delete_producto(id_producto):
    try:
        resultado = productos_collection.delete_one({'_id': ObjectId(id_producto)})
        if resultado.deleted_count > 0:
            return jsonify({"mensaje": "Producto eliminado exitosamente"}), 200 
        else:
            return jsonify({"error": "Producto no encontrado para eliminar"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    popular_db_si_vacia()
    app.run(debug=True, port=5000)