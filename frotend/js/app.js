const API_URL = 'http://localhost:5000/api';
let carrito = [];
let productosDisponibles = []; 

const listaProductosClienteEl = document.getElementById('lista-productos-cliente');
const cantidadCarritoEl = document.getElementById('cantidad-carrito');
const listaCarritoEl = document.getElementById('lista-carrito');
const totalCarritoEl = document.getElementById('total-carrito');

const modalEl = document.getElementById('detalle-producto-modal');
const modalNombreEl = document.getElementById('modal-nombre-producto');
const modalImagenEl = document.getElementById('modal-imagen-producto');
const modalDescripcionEl = document.getElementById('modal-descripcion-producto');
const modalPrecioEl = document.getElementById('modal-precio-producto');
const modalStockEl = document.getElementById('modal-stock-producto');
const modalTallasEl = document.getElementById('modal-tallas-producto');
const modalColoresEl = document.getElementById('modal-colores-producto');
let productoSeleccionadoParaModal = null;

const formProducto = document.getElementById('form-producto');
const productoIdInput = document.getElementById('producto-id');
const nombreInput = document.getElementById('nombre');
const descripcionInput = document.getElementById('descripcion');
const precioInput = document.getElementById('precio');
const stockInput = document.getElementById('stock');
const tallasInput = document.getElementById('tallas');
const coloresInput = document.getElementById('colores');
const imagenUrlInput = document.getElementById('imagen_url');
const btnGuardarProducto = document.getElementById('btn-guardar-producto');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const cuerpoTablaProductosAdmin = document.getElementById('cuerpo-tabla-productos-admin');

function mostrarModalDetalle(productoId) {
    const producto = productosDisponibles.find(p => p._id === productoId);
    if (!producto) return;

    productoSeleccionadoParaModal = producto;

    modalNombreEl.textContent = producto.nombre;
    modalImagenEl.src = producto.imagen_url || 'https://via.placeholder.com/200x200.png?text=Sin+Imagen';
    modalImagenEl.alt = producto.nombre;
    modalDescripcionEl.textContent = producto.descripcion;
    modalPrecioEl.textContent = producto.precio.toFixed(2);
    modalStockEl.textContent = producto.stock;
    modalTallasEl.textContent = producto.tallas ? producto.tallas.join(', ') : 'No especificado';
    modalColoresEl.textContent = producto.colores ? producto.colores.join(', ') : 'No especificado';
    
    const btnAnadirCarritoModal = document.getElementById('btn-anadir-carrito-modal');
    if (producto.stock > 0) {
        btnAnadirCarritoModal.disabled = false;
        btnAnadirCarritoModal.textContent = 'Añadir al Carrito';
    } else {
        btnAnadirCarritoModal.disabled = true;
        btnAnadirCarritoModal.textContent = 'Sin Stock';
    }
    
    modalEl.style.display = 'flex';
}

function cerrarModalDetalle() {
    modalEl.style.display = 'none';
    productoSeleccionadoParaModal = null;
}

function agregarAlCarritoDesdeModal() {
    if (productoSeleccionadoParaModal && productoSeleccionadoParaModal.stock > 0) {
        agregarAlCarrito(productoSeleccionadoParaModal._id, productoSeleccionadoParaModal.nombre, productoSeleccionadoParaModal.precio);
        cerrarModalDetalle();
    }
}

window.onclick = function(event) {
    if (event.target == modalEl) {
        cerrarModalDetalle();
    }
}

async function cargarYMostrarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        productosDisponibles = await response.json();
        
        mostrarProductosCliente(productosDisponibles);
        mostrarProductosAdmin(productosDisponibles);

    } catch (error) {
        console.error("Error al cargar productos:", error);
        if (listaProductosClienteEl) listaProductosClienteEl.innerHTML = "<p>Error al cargar productos.</p>";
        if (cuerpoTablaProductosAdmin) cuerpoTablaProductosAdmin.innerHTML = "<tr><td colspan='4'>Error al cargar productos.</td></tr>";
    }
}

function mostrarProductosCliente(productos) {
    if (!listaProductosClienteEl) return;
    listaProductosClienteEl.innerHTML = '';
    productos.forEach(producto => {
        const productoCard = document.createElement('div');
        productoCard.classList.add('producto-card');
        productoCard.innerHTML = `
            <img src="${producto.imagen_url || 'https://via.placeholder.com/150x150.png?text=Producto'}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p class="descripcion" title="${producto.descripcion}">${producto.descripcion.substring(0, 60)}...</p>
            <p class="precio">$${producto.precio.toFixed(2)}</p>
            <p class="stock">Stock: ${producto.stock > 0 ? producto.stock : 'Agotado'}</p>
            <button onclick="mostrarModalDetalle('${producto._id}')">Ver Detalles</button>
            ${producto.stock > 0 ? `<button onclick="agregarAlCarrito('${producto._id}', '${producto.nombre}', ${producto.precio})">Añadir al Carrito</button>` : '<button disabled>Sin Stock</button>'}
        `;
        listaProductosClienteEl.appendChild(productoCard);
    });
}

function mostrarProductosAdmin(productos) {
    if (!cuerpoTablaProductosAdmin) return;
    cuerpoTablaProductosAdmin.innerHTML = '';
    productos.forEach(producto => {
        const fila = cuerpoTablaProductosAdmin.insertRow();
        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>${producto.stock}</td>
            <td>
                <button class="btn-accion btn-editar" onclick="editarProducto('${producto._id}')">Editar</button>
                <button class="btn-accion btn-eliminar" onclick="eliminarProducto('${producto._id}')">Eliminar</button>
            </td>
        `;
    });
}

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = productoIdInput.value;
    const productoData = {
        nombre: nombreInput.value,
        descripcion: descripcionInput.value,
        precio: parseFloat(precioInput.value),
        stock: parseInt(stockInput.value),
        tallas: tallasInput.value.split(',').map(t => t.trim()).filter(t => t), 
        colores: coloresInput.value.split(',').map(c => c.trim()).filter(c => c), 
        imagen_url: imagenUrlInput.value || undefined 
    };

    if (!productoData.imagen_url) delete productoData.imagen_url;


    let url = `${API_URL}/productos`;
    let method = 'POST';

    if (id) { // Modo edición
        url += `/${id}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
      
        resetFormularioProducto();
        cargarYMostrarProductos(); 
        alert(id ? 'Producto actualizado con éxito' : 'Producto creado con éxito');

    } catch (error) {
        console.error('Error al guardar producto:', error);
        alert(`Error al guardar producto: ${error.message}`);
    }
});

function editarProducto(id) {
    const producto = productosDisponibles.find(p => p._id === id);
    if (!producto) return;

    productoIdInput.value = producto._id;
    nombreInput.value = producto.nombre;
    descripcionInput.value = producto.descripcion;
    precioInput.value = producto.precio;
    stockInput.value = producto.stock;
    tallasInput.value = producto.tallas ? producto.tallas.join(', ') : '';
    coloresInput.value = producto.colores ? producto.colores.join(', ') : '';
    imagenUrlInput.value = producto.imagen_url || '';

    btnGuardarProducto.textContent = 'Actualizar Producto';
    btnCancelarEdicion.style.display = 'inline-block';
    document.getElementById('admin-productos').scrollIntoView({ behavior: 'smooth' }); 
}

btnCancelarEdicion.addEventListener('click', () => {
    resetFormularioProducto();
});

function resetFormularioProducto() {
    formProducto.reset();
    productoIdInput.value = '';
    btnGuardarProducto.textContent = 'Guardar Producto';
    btnCancelarEdicion.style.display = 'none';
}

async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
        const response = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        cargarYMostrarProductos(); 
        alert('Producto eliminado con éxito');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert(`Error al eliminar producto: ${error.message}`);
    }
}

function agregarAlCarrito(id, nombre, precio) {
    const productoEnStock = productosDisponibles.find(p => p._id === id);
    if (!productoEnStock || productoEnStock.stock <= 0) {
        alert("Este producto está agotado o no disponible.");
        return;
    }

    const itemExistente = carrito.find(item => item.id === id);
    if (itemExistente) {
        if (itemExistente.cantidad < productoEnStock.stock) { 
            itemExistente.cantidad++;
        } else {
            alert(`No puedes añadir más de ${productoEnStock.nombre}, stock máximo alcanzado en el carrito.`);
            return;
        }
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    actualizarCarritoDisplay();
}

function quitarDelCarrito(id) {
    const itemIndex = carrito.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        if (carrito[itemIndex].cantidad > 1) {
            carrito[itemIndex].cantidad--;
        } else {
            carrito.splice(itemIndex, 1);
        }
    }
    actualizarCarritoDisplay();
}

function actualizarCarritoDisplay() {
    if (!cantidadCarritoEl || !listaCarritoEl || !totalCarritoEl) return; //
    
    cantidadCarritoEl.textContent = carrito.reduce((total, item) => total + item.cantidad, 0);
    listaCarritoEl.innerHTML = '';
    let total = 0;

    carrito.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toFixed(2)}
            <button onclick="quitarDelCarrito('${item.id}')">Quitar</button>
        `;
        listaCarritoEl.appendChild(li);
        total += item.precio * item.cantidad;
    });

    totalCarritoEl.textContent = total.toFixed(2);
    localStorage.setItem('carritoTiendaRopa', JSON.stringify(carrito));
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoDisplay();
}

function procesarCompra() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    alert(`Procesando compra (simulación):\nTotal: $${totalCarritoEl.textContent}\nItems: ${JSON.stringify(carrito, null, 2)}`);
    


    vaciarCarrito();
 
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    const carritoGuardado = localStorage.getItem('carritoTiendaRopa');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
    
    cargarYMostrarProductos(); 
    actualizarCarritoDisplay();


    if (formProducto) {
        resetFormularioProducto();
    }
});