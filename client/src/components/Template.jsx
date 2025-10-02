import Header from './Header'
import Footer from './Footer'
import Sidebar from './SideBar'
import NotificationBanner from './NotificationBanner'

const Template = ({page="accueil", children, userT}) => <>
    <Header Page={page}/>
    <div className="childrenwrapper">
        <Sidebar userT={userT}/>
        <div style={{ flex: 1 }}>
            <NotificationBanner />
            {children}
        </div>
    </div>
    <Footer/>
</>

export default Template