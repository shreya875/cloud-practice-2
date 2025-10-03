const Modbus = require('jsmodbus')
const net = require('net')

const server = new net.Server()

// Allocate 2 holding registers (4 bytes)
const holdingRegisters = Buffer.alloc(2 * 2)

// Function to update registers with random values
function updateRandomData() {
  const temp = Math.floor(20 + Math.random() * 20)  // 20-40 °C
  const vibration = Math.floor(Math.random() * 5)    // 0-4 units

  holdingRegisters.writeUInt16BE(temp, 0)     // Register 0
  holdingRegisters.writeUInt16BE(vibration, 2) // Register 1

  console.log(`Updated registers: temp=${temp}, vibration=${vibration}`)
}

const serverTCP = new Modbus.server.TCP(server, {
  holding: holdingRegisters,
  coils: Buffer.alloc(0),
  discrete: Buffer.alloc(0),
  input: Buffer.alloc(0)
})

server.listen(5020, () => {
  console.log('Modbus TCP Slave listening on port 5020')
})

// Update register data every 2 seconds
setInterval(() => {
  updateRandomData()
}, 2000)
