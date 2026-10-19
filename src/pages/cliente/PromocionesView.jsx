export default function PromocionesView() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h3 className="text-3xl font-extrabold text-gray-900 mb-8 border-b-2 border-blue-900 pb-2">
        Promociones y Ofertas Especiales
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-800 text-white rounded-2xl p-8 shadow-xl flex flex-col justify-between">
          <div>
            <span className="bg-yellow-400 text-purple-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase">
              ¡Oferta de Fin de Semana!
            </span>
            <h4 className="text-3xl font-bold mt-4">20% de Descuento en Matrimoniales</h4>
            <p className="mt-2 text-purple-200">Reserva 2 noches o más durante viernes y sábado y recibe un desayuno especial andino cortesía de la casa.</p>
          </div>
          <div className="mt-8">
            <span className="text-sm font-bold bg-white/10 px-4 py-2 rounded-lg">Código: HUANCAYOLOVE</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-sky-800 text-white rounded-2xl p-8 shadow-xl flex flex-col justify-between">
          <div>
            <span className="bg-green-400 text-blue-950 font-extrabold text-xs px-3 py-1 rounded-full uppercase">
              Tarifa Corporativa
            </span>
            <h4 className="text-3xl font-bold mt-4">Viajes de Negocios</h4>
            <p className="mt-2 text-blue-100">Si viajas por trabajo de lunes a jueves, accede a nuestra tarifa plana con lavandería exprés incluida.</p>
          </div>
          <div className="mt-8">
            <span className="text-sm font-bold bg-white/10 px-4 py-2 rounded-lg">Pregunta por WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  )
}