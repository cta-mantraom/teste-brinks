import './App.css'
import { CheckoutFlow } from './components/checkout/CheckoutFlow'

function App() {
  const FIXED_AMOUNT = 5.00

  return (
    <div className="App">
      <CheckoutFlow amount={FIXED_AMOUNT} />
    </div>
  )
}

export default App