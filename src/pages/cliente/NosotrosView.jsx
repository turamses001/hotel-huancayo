export default function NosotrosView() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h3 className="text-3xl font-extrabold text-gray-900 mb-8 border-b-2 border-blue-900 pb-2">
        Sobre Hotel Huancayo
      </h3>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8">
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <h4 className="text-2xl font-bold text-blue-900">Tradición y modernidad en el Valle del Mantaro</h4>
          <p>
            Fundado con el compromiso de ofrecer un hogar lejos de casa, Hotel Huancayo combina la cálida hospitalidad de nuestra tierra con instalaciones modernas diseñadas para el viajero exigente.
          </p>
          <p>
            Nos ubicamos estratégicamente cerca del centro financiero y turístico, facilitando tu acceso a los principales atractivos de la Incontrastable. ¡Te esperamos con los brazos abiertos!
          </p>
        </div>
        <div>
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80" 
            alt="Hotel fachada" 
            className="rounded-xl shadow-md w-full h-80 object-cover"
          />
        </div>
      </div>
    </div>
  )
}