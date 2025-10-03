const Modbus = require('jsmodbus')
const net = require('net')

const server = new net.Server()


const holdingRegisters = Buffer.alloc(2 * 2) // 2 registers (4 bytes)

function updateRandomData() {
  // Random temperature 20-40 C, vibration 0-5 units
  const temp = Math.floor(20 + Math.random() * 20)
  const vibration = Math.floor(Math.random() * 5)

  holdingRegisters.writeUInt16BE(temp, 0)
  holdingRegisters.writeUInt16BE(vibration, 2)
  console.log(`Updated registers: temp=${temp}, vibration=${vibration}`)
}

const vector = {
  getHoldingRegister: (addr, unitID) => {
    // addr 0 or 1
    return holdingRegisters.readUInt16BE(addr * 2)
  },
  getHoldingRegisters: (addr, length, unitID) => {
    return holdingRegisters.slice(addr * 2, (addr + length) * 2)
  }
}

const serverTCP = new Modbus.server.TCP(server, {
  holding: holdingRegisters,
  holdingAddr: 0,
  coils: Buffer.alloc(0),
  discrete: Buffer.alloc(0),
  input: Buffer.alloc(0)
})

server.listen(5020, () => {
  console.log('Modbus TCP Slave listening on port 5020')
})

setInterval(() => {
  updateRandomData()
}, 2000)
