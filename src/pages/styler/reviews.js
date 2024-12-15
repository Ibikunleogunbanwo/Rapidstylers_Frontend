import Back from "../../components/goBack";
import star from "../../assets/svg-icons/whiteStar.svg";

const Reviews = () => {
    return (
      <div className="rounded-md border">
        <div className="flex items-center gap-3 border-b p-4 text-sm font-medium">
          <Back />
          <span>Reviews</span>
        </div>
        <div className="p-4">
          <div className="px-4 py-5 rounded-md bg-brand flex items-center gap-3 mb-6">
            <div>
              <img src={star} alt="" className="h-4" />
            </div>
            <div className="text-sm text-white/70">
              <span className="font-bold text-white">4.0</span> (out of 5) -
              Based on <span>419</span> reviews
            </div>
          </div>

          <div className="grid gap-4">
            <div className="text-[15px] pb-3 border-b last:border-0">
              <div className="flex justify-between mb-1">
                <div>Nurudeen Faniyi</div>
                <div className="font-bold">4.0</div>
              </div>
              <div className="text-gray-500 ">
                I had the most amazing experience at Iya Bimbo’s place! My
                stylist was absolutely incredible. They listened carefully to my
                wants and needs and created a hair style that was both
                flattering and manageable. The salon itself was clean, inviting,
                and relaxing. I will definitely be returning for all my future
                hair care needs!
              </div>
            </div>
            <div className="text-[15px] pb-3 border-b last:border-0">
              <div className="flex justify-between mb-1">
                <div>Nurudeen Faniyi</div>
                <div className="font-bold">4.0</div>
              </div>
              <div className="text-gray-500 ">
                I had the most amazing experience at Iya Bimbo’s place! My
                stylist was absolutely incredible. They listened carefully to my
                wants and needs and created a hair style that was both
                flattering and manageable. The salon itself was clean, inviting,
                and relaxing. I will definitely be returning for all my future
                hair care needs!
              </div>
            </div>
            <div className="text-[15px] pb-3 border-b last:border-0">
              <div className="flex justify-between mb-1">
                <div>Nurudeen Faniyi</div>
                <div className="font-bold">4.0</div>
              </div>
              <div className="text-gray-500 ">
                I had the most amazing experience at Iya Bimbo’s place! My
                stylist was absolutely incredible. They listened carefully to my
                wants and needs and created a hair style that was both
                flattering and manageable. The salon itself was clean, inviting,
                and relaxing. I will definitely be returning for all my future
                hair care needs!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
 
export default Reviews;