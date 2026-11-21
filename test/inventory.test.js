'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function makeProduct(overrides) {
  return Object.assign({
    id: 7,
    sku: 'TEST-007',
    name: 'Test item',
    hsn: '1006',
    price: 10,
    stock: 4,
    reserved: 3
  }, overrides || {});
}

function routeLineItem(product, qty) {
  // Keep this shape in sync with the line object built by routes/orders.js.
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: qty
  };
}

test('inventory.check accepts qty 1 when sellable stock is 1', function () {
  const product = makeProduct({ stock: 1, reserved: 0 });
  const result = inventory.check([product], [routeLineItem(product, 1)]);

  assert.deepEqual(result, { ok: true });
});

test('CURRENT BEHAVIOUR: inventory.check rejects qty 2 when sellable stock is 1', function () {
  const product = makeProduct({ stock: 1, reserved: 0 });

  assert.equal(inventory.check([product], [routeLineItem(product, 2)]).ok, false);
});

test('CURRENT BEHAVIOUR: inventory.check accepts qty 0 when sellable stock is 1', function () {
  const product = makeProduct({ stock: 1, reserved: 0 });

  assert.deepEqual(inventory.check([product], [routeLineItem(product, 0)]), { ok: true });
});

test('inventory.check accepts the last sellable unit when stock is 4 and reserved is 3', function () {
  const product = makeProduct({ stock: 4, reserved: 3 });
  const result = inventory.check([product], [routeLineItem(product, 1)]);

  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(result, { ok: true });
});

test('cancelling a pending order restores stock after reserve', function () {
  const product = makeProduct({ stock: 4, reserved: 3 });
  const line = routeLineItem(product, 1);
  const db = { products: [product], orders: [], nextOrderId: 1001 };
  const stockStates = [{ stock: product.stock, reserved: product.reserved }];

  const order = orders.add(db, {
    paymentMode: 'cash',
    status: 'pending',
    items: [line]
  });
  inventory.reserve(db.products, order.items);
  stockStates.push({ stock: product.stock, reserved: product.reserved });

  const result = orders.cancel(db, order.id, 'Characterization test');
  stockStates.push({ stock: product.stock, reserved: product.reserved });

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(stockStates, [
    { stock: 4, reserved: 3 },
    { stock: 3, reserved: 3 },
    { stock: 4, reserved: 3 }
  ]);
});

test('a customer can buy the last sellable unit and cancellation restores it exactly once', function () {
  const product = makeProduct({ stock: 4, reserved: 3 });
  const line = routeLineItem(product, 1);
  const db = { products: [product], orders: [], nextOrderId: 1001 };
  const saleAllowed = inventory.check(db.products, [line]).ok;
  const duplicateLineRequestAllowed = inventory.check(db.products, [line, line]).ok;

  const order = orders.add(db, {
    paymentMode: 'cash',
    status: 'pending',
    items: [line]
  });
  inventory.reserve(db.products, order.items);
  const afterReserve = { stock: product.stock, reserved: product.reserved };

  const cancellation = orders.cancel(db, order.id, 'Characterization test');
  const afterCancel = { stock: product.stock, reserved: product.reserved };

  const repeatedCancellation = orders.cancel(db, order.id, 'Repeated cancellation');
  const afterRepeatedCancel = { stock: product.stock, reserved: product.reserved };

  assert.deepEqual({
    saleAllowed: saleAllowed,
    duplicateLineRequestAllowed: duplicateLineRequestAllowed,
    cancellationOk: cancellation.ok,
    afterReserve: afterReserve,
    afterCancel: afterCancel,
    repeatedCancellationOk: repeatedCancellation.ok,
    afterRepeatedCancel: afterRepeatedCancel
  }, {
    saleAllowed: true,
    duplicateLineRequestAllowed: false,
    cancellationOk: true,
    afterReserve: { stock: 3, reserved: 3 },
    afterCancel: { stock: 4, reserved: 3 },
    repeatedCancellationOk: false,
    afterRepeatedCancel: { stock: 4, reserved: 3 }
  });
});
