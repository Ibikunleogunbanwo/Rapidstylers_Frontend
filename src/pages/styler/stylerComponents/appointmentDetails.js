import Modal from "../../../components/modals"

const AppointmentDetails = ({onclose}) => {
    return ( 
        <Modal isVisible onClose={onclose} modalTitle="Appointment details" width="md:w-1/2 lg:w-1/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
                <div className="text-sm md:col-span-2">
                  <div className="text-gray-400">Client name:</div>
                  <div>John Wick <span className="text-gray-600 font-medium text-xs">(+3 guests)</span></div>
                </div>
                <div className="text-sm md:col-span-2">
                  <div className="text-gray-400">Service name:</div>
                  <div>Special haircut - (skin fade, blow out, mohawk)</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-400">Service delivery:</div>
                  <div>Home service</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-400">Date / time:</div>
                  <div>24 December, 20:00</div>
                </div>
                <div className="text-sm md:col-span-2">
                  <div className="text-gray-400">Home address:</div>
                  <div>123 Maple Street Toronto, ON M5H 2N2 Canada</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-400">Cost:</div>
                  <div>$59.00</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-400">Tip:</div>
                  <div>$20:00</div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white p-4 -mx-6 -mb-8">
                {/* <div className="bg-emerald-500 rounded-md text-xs text-white p-5 text-center">Confirm appointment</div> */}
                <div className="bg-rose-100 rounded-md text-xs text-rose-500 p-5 text-center">Cancel appointment</div>
              </div>
        </Modal>
     );
}
 
export default AppointmentDetails;