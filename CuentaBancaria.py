class CuentaBancaria:
    def __init__(self, saldo_inicial):
        self.__balance = saldo_inicial
            
    def depositar(self, monto):
        self.__balance += monto
        
    def consultar_balance(self):
        return self.__balance
        
    cuenta = CuentaBancaria:(1000)
    cuenta.depositar(500)
    print(cuenta.consultar_balance())